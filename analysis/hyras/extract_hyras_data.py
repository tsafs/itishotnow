#!/usr/bin/env python
"""
Extract HYRAS NetCDF climate data for weather stations.

This script processes NetCDF climate data files (HYRAS dataset) and extracts time series 
data for a list of weather stations, saving the extracted data as CSV files.
"""
import argparse
import xarray as xr
import pandas as pd
import numpy as np
from pathlib import Path
import re
import glob
import time
import logging
from datetime import timedelta
import multiprocessing as mp
from multiprocessing import Manager
from queue import Empty as QueueEmpty
import os
from tqdm import tqdm

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="Extract daily climate data for weather stations from NetCDF")
    parser.add_argument('--file', action='append', required=True, 
                        help='NetCDF file path(s). Can use patterns like "tasmax_hyras_5_{1961-1965}_v5-0_de.nc"')
    parser.add_argument('--stations', required=True, help='CSV file with station data (columns: station_id, station_name, lat, lon)')
    parser.add_argument('--param', action='append', required=True, 
                        help='Variable name(s) for climate parameters (e.g., tasmax, tasmin). Can be specified multiple times.')
    parser.add_argument('--output-dir', default='.', help='Output directory for CSV files')
    parser.add_argument('--stations-metadata', default='hyras_stations.csv', help='Output file for stations metadata')
    return parser.parse_args()


def load_stations(stations_file):
    """
    Load station data from a CSV file.
    
    Args:
        stations_file: Path to CSV file containing station data
                      with columns: station_id, station_name, lat, lon
    
    Returns:
        List of dictionaries, each representing a station
    """
    df = pd.read_csv(stations_file)
    stations = []
    
    for _, row in df.drop_duplicates(subset=['station_id']).iterrows():
        stations.append({
            'id': row['station_id'],
            'name': row['station_name'],
            'lat': row['lat'],
            'lon': row['lon']
        })
    
    return stations


def calculate_grid_centers(lat_arr, lon_arr):
    """
    Calculate the center points of each grid cell.
    
    Args:
        lat_arr, lon_arr: 2D arrays representing the grid of latitudes and longitudes at corners
    
    Returns:
        tuple (centers_lat, centers_lon) containing the center points
    """
    max_y, max_x = lat_arr.shape
    centers_lat = np.zeros((max_y - 1, max_x - 1))
    centers_lon = np.zeros((max_y - 1, max_x - 1))
    
    # Calculate centers of grid cells
    for y in range(max_y - 1):
        for x in range(max_x - 1):
            # For each cell, average the four corners to get the center
            centers_lat[y, x] = (lat_arr[y, x] + lat_arr[y+1, x] + 
                                lat_arr[y, x+1] + lat_arr[y+1, x+1]) / 4
            centers_lon[y, x] = (lon_arr[y, x] + lon_arr[y+1, x] + 
                                lon_arr[y, x+1] + lon_arr[y+1, x+1]) / 4
    
    return centers_lat, centers_lon


def find_nearest_grid_point(centers_lat, centers_lon, lat, lon):
    """
    Find the nearest grid cell to the given coordinates.
    
    Args:
        centers_lat, centers_lon: 2D arrays of grid cell centers
        lat, lon: Target coordinates to find the nearest cell for
    
    Returns:
        tuple (y, x) indices of the closest grid cell
    """
    # Vectorized distance calculation
    # Reshape arrays to work with broadcasting
    lat_diff = centers_lat - lat  # Broadcasting automatically happens here
    lon_diff = centers_lon - lon  # Broadcasting automatically happens here
    
    # Calculate squared distances (avoid sqrt for performance)
    dist_squared = lat_diff**2 + lon_diff**2
    
    # Find the indices of the minimum distance
    y, x = np.unravel_index(np.argmin(dist_squared), dist_squared.shape)
    
    return y, x


def get_grid_cell_bounds(lat_arr, lon_arr, grid_y, grid_x):
    """
    Get the corner coordinates (bounds) of a grid cell.
    
    Args:
        lat_arr, lon_arr: 2D arrays representing the grid
        grid_y, grid_x: Indices of the grid cell
    
    Returns:
        tuple (grid_lat1, grid_lon1, grid_lat2, grid_lon2) of corner coordinates
    """
    max_y, max_x = lat_arr.shape
    
    # Handle the case where the cell is at the edge of the grid
    if grid_y == max_y - 1:  # Last row
        grid_lat1 = lat_arr[grid_y, grid_x]
        # Estimate grid_lat2 by extrapolation
        if grid_y > 0:
            lat_diff = lat_arr[grid_y, grid_x] - lat_arr[grid_y - 1, grid_x]
            grid_lat2 = lat_arr[grid_y, grid_x] + lat_diff
        else:
            grid_lat2 = lat_arr[grid_y, grid_x]  # Fallback
    else:
        grid_lat1 = lat_arr[grid_y, grid_x]
        grid_lat2 = lat_arr[grid_y + 1, grid_x]
    
    if grid_x == max_x - 1:  # Last column
        grid_lon1 = lon_arr[grid_y, grid_x]
        # Estimate grid_lon2 by extrapolation
        if grid_x > 0:
            lon_diff = lon_arr[grid_y, grid_x] - lon_arr[grid_y, grid_x - 1]
            grid_lon2 = lon_arr[grid_y, grid_x] + lon_diff
        else:
            grid_lon2 = lon_arr[grid_y, grid_x]  # Fallback
    else:
        grid_lon1 = lon_arr[grid_y, grid_x]
        grid_lon2 = lon_arr[grid_y, grid_x + 1]
    
    # Format values to 2 decimal places
    return float(f"{grid_lat1:.5f}"), float(f"{grid_lon1:.5f}"), float(f"{grid_lat2:.5f}"), float(f"{grid_lon2:.5f}")


def parse_file_patterns(file_patterns):
    """
    Parse file patterns with year ranges and expand them.
    
    Args:
        file_patterns: List of file patterns, which may include year ranges like {1961-1965}
    
    Returns:
        List of expanded file paths
    """
    expanded_files = []
    
    for pattern in file_patterns:
        # Check if pattern contains year range like {1961-1965}
        year_range_match = re.search(r'\{(\d+)-(\d+)\}', pattern)
        if year_range_match:
            start_year = int(year_range_match.group(1))
            end_year = int(year_range_match.group(2))
            
            # Replace the range with each year and add to list
            for year in range(start_year, end_year + 1):
                year_file = pattern.replace(year_range_match.group(0), str(year))
                matching_files = glob.glob(year_file)
                expanded_files.extend(matching_files)
        else:
            # If no range pattern, use glob to find matching files
            matching_files = glob.glob(pattern)
            expanded_files.extend(matching_files)
    
    return expanded_files


def extract_station_timeseries(ds, station, params, centers_lat, centers_lon):
    """
    Extract time series data for a station with NaN value handling.
    
    Args:
        ds: xarray Dataset containing climate data
        station: Dictionary with station information
        params: List of climate parameters to extract
        centers_lat, centers_lon: 2D arrays of grid centers
    
    Returns:
        tuple (result, grid_y, grid_x, has_valid_data) containing:
            - result: Dictionary with parameter data
            - grid_y, grid_x: Grid coordinates
            - has_valid_data: Boolean indicating if any valid (non-NaN) data was found
    """
    grid_y, grid_x = find_nearest_grid_point(centers_lat, centers_lon, station['lat'], station['lon'])
    result = {'station': station['name']}
    has_valid_data = False
    
    # Handle multiple parameters
    for param in params:
        if param in ds:
            # Extract the parameter values at the specified grid point
            param_data = ds[param].isel(y=grid_y, x=grid_x)
            
            # Check if we have any valid (non-NaN) data
            if np.any(~np.isnan(param_data.values)):
                has_valid_data = True
            
            # Store the values, ensuring they align with the time dimension
            result[param] = param_data.values
            result['time'] = param_data.time.values
    
    return result, grid_y, grid_x, has_valid_data


def process_station_worker(station, input_files, params, output_dir, result_queue, lock):
    """
    Worker function to process a station in a separate process.
    
    Args:
        station: Dictionary with station information
        input_files: List of NetCDF file paths to process
        params: List of climate parameters to extract
        output_dir: Directory for output files
        result_queue: Queue to report results back to the main process
        lock: Lock for thread-safe operations
    """
    try:
        station_start_time = time.time()
        worker_logger = logging.getLogger(f"worker-{os.getpid()}")
        worker_logger.setLevel(logging.INFO)
        worker_logger.info(f"Processing station: {station['name']} ({station['id']})")
        
        # Timing dictionary to track performance
        timings = {
            'file_open_time': 0.0,
            'grid_centers_calculation_time': 0.0,
            'extract_timeseries_time': 0.0,
            'data_processing_time': 0.0,
            'file_writing_time': 0.0,
            'total_files_processed': 0
        }
        
        # Create empty DataFrame for this worker
        station_metadata_df = pd.DataFrame(columns=[
            'station_id', 'station_name', 'station_lat', 'station_lon', 
            'grid_y', 'grid_x', 'grid_lat1', 'grid_lon1', 'grid_lat2', 'grid_lon2'
        ])
        
        # Process the station by loading each dataset only when needed
        station_data_dict = {}
        grid_bounds = {}
        grid_y = None
        grid_x = None
        has_any_valid_data = False
        
        # Grid center caches - calculate only once per worker
        centers_lat = None
        centers_lon = None
        lat_arr = None
        lon_arr = None
        
        # Process each input file individually to reduce memory usage
        for file_path in input_files:
            try:
                # Track file processing time
                file_start_time = time.time()
                
                # Load dataset only when needed and close it immediately after use
                worker_logger.debug(f"Opening file: {file_path}")
                file_open_start = time.time()
                with xr.open_dataset(file_path) as ds:
                    file_open_time = time.time() - file_open_start
                    timings['file_open_time'] += file_open_time
                    
                    # Check which parameters are in this file
                    available_params = [param for param in params if param in ds]
                    if not available_params:
                        continue
                    
                    timings['total_files_processed'] += 1
                    
                    # Calculate grid centers only once per worker
                    if centers_lat is None or centers_lon is None:
                        # Get lat and lon arrays for bounds calculation
                        centers_start = time.time()
                        
                        lat_arr = ds['lat'].values
                        lon_arr = ds['lon'].values
                        centers_lat, centers_lon = calculate_grid_centers(lat_arr, lon_arr)
                        
                        centers_time = time.time() - centers_start
                        timings['grid_centers_calculation_time'] += centers_time
                        
                        worker_logger.info(f"Grid dimensions: {lat_arr.shape} - calculated grid centers once (took {centers_time:.2f}s)")
                    
                    # Extract data with NaN checking
                    extract_start = time.time()
                    station_data, current_grid_y, current_grid_x, has_valid_data = extract_station_timeseries(
                        ds, station, params, centers_lat, centers_lon
                    )
                    extract_time = time.time() - extract_start
                    timings['extract_timeseries_time'] += extract_time
                    
                    # Update has_any_valid_data flag
                    has_any_valid_data = has_any_valid_data or has_valid_data
                    
                    # Set grid coordinates if this is the first valid dataset
                    if grid_y is None and grid_x is None and has_valid_data:
                        grid_y = current_grid_y
                        grid_x = current_grid_x
                        
                        # Calculate and store grid cell bounds
                        grid_lat1, grid_lon1, grid_lat2, grid_lon2 = get_grid_cell_bounds(lat_arr, lon_arr, grid_y, grid_x)
                        grid_bounds = {
                            'grid_lat1': grid_lat1,
                            'grid_lon1': grid_lon1,
                            'grid_lat2': grid_lat2,
                            'grid_lon2': grid_lon2
                        }
                    
                    # Add data for this station, skipping days with NaN values
                    data_proc_start = time.time()
                    for i, date in enumerate(station_data.get("time", [])):
                        date_str = pd.to_datetime(date).strftime('%Y-%m-%d')
                        
                        # Create entry for this date if it doesn't exist
                        if date_str not in station_data_dict:
                            station_data_dict[date_str] = {'date': date_str}
                        
                        # Add each available parameter to the existing entry, skipping NaN values
                        for param in params:
                            if param in station_data and i < len(station_data[param]):
                                if not np.isnan(station_data[param][i]):  # Skip NaN values
                                    station_data_dict[date_str][param] = station_data[param][i]
                    data_proc_time = time.time() - data_proc_start
                    timings['data_processing_time'] += data_proc_time
                    
                # Log timing for this file if it's taking too long
                file_total_time = time.time() - file_start_time
                if file_total_time > 5:  # Only log if file processing takes more than 5 seconds
                    worker_logger.info(
                        f"File {os.path.basename(file_path)} processed in {file_total_time:.2f}s "
                        f"(open: {file_open_time:.2f}s, extract: {extract_time:.2f}s, data processing: {data_proc_time:.2f}s)"
                    )
            
            except Exception as e:
                worker_logger.error(f"Error processing {file_path} for {station['name']}: {e}")
        
        # If we don't have any valid data for this station, return without adding to metadata
        if not has_any_valid_data or grid_y is None or grid_x is None:
            if not has_any_valid_data:
                worker_logger.warning(f"No valid (non-NaN) data found for {station['name']} - excluding from results")
            else:
                worker_logger.warning(f"Could not determine grid coordinates for {station['name']} - excluding from results")
            
            result = {
                'station_name': station['name'],
                'processing_time': time.time() - station_start_time,
                'has_valid_data': False,
                'station_metadata_df': pd.DataFrame(),
                'timings': timings
            }
            result_queue.put(result)
            return
        
        # Add new row to station_metadata_df
        new_station_row = {
            'station_id': station['id'],
            'station_name': station['name'],
            'station_lat': float(f"{station['lat']:.5}"),
            'station_lon': float(f"{station['lon']:.5f}"),
            'grid_y': grid_y,
            'grid_x': grid_x,
        }
        
        # Add grid bounds if available
        for bound_name, bound_val in grid_bounds.items():
            new_station_row[bound_name] = bound_val
        
        # Append new row to station_metadata_df
        station_metadata_df = pd.concat([station_metadata_df, pd.DataFrame([new_station_row])], ignore_index=True)
        
        # Convert dictionary to list for DataFrame creation
        data_proc_start = time.time()
        station_data_list = list(station_data_dict.values())
        station_df = pd.DataFrame(station_data_list)
        data_proc_time = time.time() - data_proc_start
        timings['data_processing_time'] += data_proc_time
        
        if not station_df.empty:  # Only create file if we have data
            # Sort by date
            if 'date' in station_df.columns:
                station_df['date'] = pd.to_datetime(station_df['date'])
                station_df = station_df.sort_values('date')
                station_df['date'] = station_df['date'].dt.strftime('%Y-%m-%d')
            
            # Format numeric columns to 2 decimal places before saving
            for col in station_df.select_dtypes(include=['float']).columns:
                station_df[col] = station_df[col].map(lambda x: float(f"{x:.2f}"))
            
            # Write to file
            write_start = time.time()
            station_file_path = output_dir / f"{station['id']}.csv"
            station_df.to_csv(station_file_path, index=False)
            write_time = time.time() - write_start
            timings['file_writing_time'] += write_time
            
            worker_logger.info(f"Saved: {station_file_path}")
            
            # Free memory
            del station_df
            del station_data_list
        else:
            worker_logger.warning(f"No data found for {station['name']} ({station['id']})")
        
        # Calculate processing time
        station_processing_time = time.time() - station_start_time
        
        # Free memory
        del station_data_dict
        del grid_bounds
        
        # Log timing summary
        worker_logger.info(
            f"Station {station['name']} processed in {station_processing_time:.2f}s - "
            f"File opens: {timings['file_open_time']:.2f}s, "
            f"Grid centers: {timings['grid_centers_calculation_time']:.2f}s, "
            f"Data extraction: {timings['extract_timeseries_time']:.2f}s, "
            f"Data processing: {timings['data_processing_time']:.2f}s, "
            f"File writing: {timings['file_writing_time']:.2f}s"
        )
        
        # Put results in queue, avoiding large memory transfers
        has_valid_data = len(station_metadata_df) > 0
            
        result = {
            'station_name': station['name'],
            'processing_time': station_processing_time,
            'has_valid_data': has_valid_data,
            'station_metadata_df': station_metadata_df,
            'timings': timings
        }
        result_queue.put(result)
        
    except Exception as e:
        worker_logger.error(f"Error processing station {station['name']}: {e}")
        # Put error result in queue
        result_queue.put({
            'station_name': station['name'],
            'processing_time': 0,
            'has_valid_data': False,
            'station_metadata_df': pd.DataFrame(),
            'error': str(e)
        })


def main():
    """Main execution function."""
    args = parse_arguments()

    # Parse and expand file patterns
    input_files = parse_file_patterns(args.file)
    if not input_files:
        logger.error("No matching input files found.")
        return
    
    logger.info(f"Processing {len(input_files)} input files...")
    
    # Create output directory if it doesn't exist
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Load stations
    stations = load_stations(args.stations)
    total_stations = len(stations)
    logger.info(f"Loaded {total_stations} stations for processing")
    
    # Initialize an empty stations metadata file 
    stations_df = pd.DataFrame(columns=[
        'station_id', 'station_name', 'station_lat', 'station_lon', 
        'grid_y', 'grid_x', 'grid_lat1', 'grid_lon1', 'grid_lat2', 'grid_lon2'
    ])
    
    # Process parameters
    params = args.param  # List of parameters to extract
    
    # Validate that the input files exist and can be opened
    valid_input_files = []
    for file_path in input_files:
        try:
            with xr.open_dataset(file_path) as ds:
                pass
            valid_input_files.append(file_path)
        except Exception as e:
            logger.error(f"Error validating {file_path}: {e}")
    
    if not valid_input_files:
        logger.error("No valid input files found. Exiting.")
        return
    
    logger.info(f"Found {len(valid_input_files)} valid input files")
    
    # Process stations in parallel using multiprocessing
    start_time = time.time()
    
    # Determine the number of processes to use
    num_processes = mp.cpu_count() - 1  # Leave one CPU for the OS
    if num_processes < 1:
        num_processes = 1
    logger.info(f"Using {num_processes} CPU cores for parallel processing")
    
    # Create a manager for shared resources
    manager = Manager()
    result_queue = manager.Queue()
    lock = manager.Lock()
    
    # Create station batches for processing
    station_batches = []
    batch_size = min(20, max(1, total_stations // (num_processes * 2)))  # Dynamic batch size
    
    for i in range(0, len(stations), batch_size):
        station_batches.append(stations[i:i+batch_size])
    
    logger.info(f"Split stations into {len(station_batches)} batches of approximately {batch_size} stations each")
    
    completed_stations = 0
    station_processing_times = []
    valid_stations = 0
    last_save_time = time.time()
    
    # Create a process pool
    with mp.Pool(processes=num_processes) as pool:
        # Submit all batch processing tasks
        results = []
        for batch in station_batches:
            for station in batch:
                results.append(pool.apply_async(
                    process_station_worker, 
                    args=(station, valid_input_files, params, output_dir, result_queue, lock)
                ))
        
        # Total number of tasks
        total_tasks = sum(len(batch) for batch in station_batches)
        
        # Process results as they become available
        with tqdm(total=total_tasks, desc="Processing stations") as pbar:
            while completed_stations < total_tasks:
                try:
                    # Get the next result with a timeout
                    result = result_queue.get(timeout=1)
                    
                    # Update tracking variables
                    completed_stations += 1
                    pbar.update(1)
                    
                    if 'processing_time' in result:
                        station_processing_times.append(result['processing_time'])
                    
                    if result.get('has_valid_data', False):
                        valid_stations += 1
                        # Append the station data to the main DataFrame
                        if 'station_metadata_df' in result and not result['station_metadata_df'].empty:
                            with lock:
                                stations_df = pd.concat([stations_df, result['station_metadata_df']], ignore_index=True)
                    
                    # Calculate and log progress periodically
                    if time.time() - last_save_time > 30 or completed_stations == total_tasks:  # Save every 30 seconds or on completion
                        elapsed = time.time() - start_time
                        
                        # Calculate ETA
                        if station_processing_times:
                            avg_time_per_station = sum(station_processing_times) / len(station_processing_times)
                            remaining_stations = total_tasks - completed_stations
                            eta_seconds = avg_time_per_station * remaining_stations / num_processes
                            eta = str(timedelta(seconds=int(eta_seconds)))
                        else:
                            eta = "calculating..."
                        
                        logger.info(f"Progress: {completed_stations}/{total_tasks} stations completed ({completed_stations/total_tasks*100:.2f}%)")
                        logger.info(f"Time elapsed: {str(timedelta(seconds=int(elapsed)))}, ETA: {eta}")
                        
                        # Save stations metadata periodically
                        if not stations_df.empty:
                            stations_metadata_path = output_dir / args.stations_metadata
                            with lock:
                                stations_df.to_csv(stations_metadata_path, index=False)
                            logger.info(f"Saved stations metadata: {stations_metadata_path}")
                        
                        # Force garbage collection to free memory
                        import gc
                        gc.collect()
                        
                        last_save_time = time.time()
                
                except QueueEmpty:
                    # Queue timeout, just continue
                    continue
                except Exception as e:
                    logger.error(f"Error processing results: {str(e)}")
                
        # Make sure all processes are done
        for r in results:
            r.wait()
    
    # Final save of station metadata - only if we have any stations with valid data
    if not stations_df.empty:
        stations_metadata_path = output_dir / args.stations_metadata
        stations_df.to_csv(stations_metadata_path, index=False)
        logger.info(f"Saved final stations metadata with {len(stations_df)} entries (out of {total_stations} stations)")
    else:
        logger.warning("No valid station data found, metadata file not created")
    
    # Final report
    total_time = time.time() - start_time
    logger.info(f"All processing complete! Processed {total_stations} stations in {str(timedelta(seconds=int(total_time)))}")
    logger.info(f"Found valid data for {valid_stations} out of {total_stations} stations ({valid_stations/total_stations*100:.1f}%)")


if __name__ == "__main__":
    main()
