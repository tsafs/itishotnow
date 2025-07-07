import pandas as pd
import numpy as np
from datetime import timedelta
import argparse
import os
import multiprocessing as mp  # For parallel processing
from multiprocessing import Manager
from queue import Empty as QueueEmpty
import time
import logging
from tqdm import tqdm  # For progress display
import ephem  # For sun position calculations

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

LEAP_YEAR = 2020
HOURS_AFTER_NOON = 2 # Time after noon when the peak temperature is expected

def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Interpolate hourly temperatures for stations based on min, max, and mean data.')
    parser.add_argument('--input-file', type=str, required=True,
                        help='CSV file containing station data with location information')
    parser.add_argument('--hyras-data', type=str, required=True,
                        help='Directory containing daily temperature data files')
    parser.add_argument('--output-dir', type=str, required=True,
                        help='Directory for output CSV files with hourly temperatures')
    parser.add_argument('--output-prefix', type=str, default='hourly_temps',
                        help='Prefix for output files (default: hourly_temps)')
    return parser.parse_args()

def calculate_sun_positions(lat, lon, elevation, date):
    """
    Calculate sunrise and noon for a given location and date.
    
    Parameters:
    - lat: Latitude in decimal degrees
    - lon: Longitude in decimal degrees  
    - elevation: Elevation in meters
    - date: Date to calculate sun positions for (datetime.date)
    
    Returns:
    - tuple: (sunrise_datetime, noon_datetime) as datetime objects
    """
    # Create observer for the station
    observer = ephem.Observer()
    
    # Set coordinates and elevation
    observer.lat = str(lat)
    observer.lon = str(lon)
    observer.elevation = float(elevation)
    
    # Set date to midnight
    observer.date = date.strftime('%Y/%m/%d 00:00:00')
    
    # Calculate sun positions
    sun = ephem.Sun()
    
    # Calculate sunrise, noon, sunset times
    sunrise_time = observer.next_rising(sun)
    noon_time = observer.next_transit(sun)
    
    # Convert to datetime objects in local time
    sunrise_dt = ephem.localtime(sunrise_time)
    noon_dt = ephem.localtime(noon_time)
    
    return sunrise_dt, noon_dt

def interpolate_hourly_temperatures(min_temp, max_temp, sunrise_dt, noon_dt, 
                                   prev_day_max_temp=None, next_day_min_temp=None):
    """
    Interpolate 24 hourly temperatures based on min, max, mean temperatures and solar timing.
    Uses sine wave for warming and cosine wave for cooling.
    
    Parameters:
    - min_temp: Minimum daily temperature
    - max_temp: Maximum daily temperature
    - sunrise_dt: Sunrise time as datetime object
    - noon_dt: Solar noon time as datetime object
    - prev_day_max_temp: Maximum temperature from the previous day (optional)
    - next_day_min_temp: Minimum temperature for the next day (optional)
    
    Returns:
    - List of 24 hourly temperatures for the current day
    """
    # Extract date from noon datetime to create base date
    base_date = noon_dt.date()
    
    # Calculate t_peak (time of maximum temperature) as noon + 2 hours
    t_peak_dt = noon_dt + timedelta(hours=HOURS_AFTER_NOON)
    prev_day_t_peak_dt = t_peak_dt - timedelta(days=1)  # Previous day's peak time
    next_day_sunrise_dt = sunrise_dt + timedelta(days=1)  # Next day's sunrise time
    
    # If previous day's max temp is not provided, use current day's max
    if prev_day_max_temp is None:
        prev_day_max_temp = max_temp
        
    # If next day's min temp is not provided, use current day's min
    if next_day_min_temp is None:
        next_day_min_temp = min_temp
        
    # Initialize hourly temperatures for the current day
    hourly_temps = {}
    
    # Generate full hourly sequence from prev_day_t_peak_dt to next_day_sunrise_dt
    # This ensures smooth transitions across day boundaries
    current_dt = prev_day_t_peak_dt
    
    while current_dt < next_day_sunrise_dt:
        # Calculate temperature for this datetime
        if current_dt < sunrise_dt:
            # Early morning cooling phase (from previous day's peak to today's sunrise)
            # Uses cosine cooling from previous day's max to today's min
            t_normalized = (current_dt - prev_day_t_peak_dt).total_seconds() / (sunrise_dt - prev_day_t_peak_dt).total_seconds()
            temp = prev_day_max_temp - (prev_day_max_temp - min_temp) * (1 - np.cos(np.pi * t_normalized)) / 2
            
        elif current_dt <= t_peak_dt:
            # Warming phase (from today's sunrise to today's peak)
            # Uses sine warming from today's min to today's max
            t_normalized = (current_dt - sunrise_dt).total_seconds() / (t_peak_dt - sunrise_dt).total_seconds()
            temp = min_temp + (max_temp - min_temp) * np.sin(np.pi/2 * t_normalized)
            
        else:
            # Evening cooling phase (from today's peak to tomorrow's sunrise)
            # Uses cosine cooling from today's max to tomorrow's min
            t_normalized = (current_dt - t_peak_dt).total_seconds() / (next_day_sunrise_dt - t_peak_dt).total_seconds()
            temp = max_temp - (max_temp - next_day_min_temp) * (1 - np.cos(np.pi * t_normalized)) / 2
        
        # Store result for this hour if it's part of the current day
        if current_dt.date() == base_date:
            hourly_temps[current_dt.hour] = temp
            
        # Advance to next hour
        current_dt += timedelta(hours=1)
    
    # Create the final array of hourly temperatures for the current day
    result = []
    for hour in range(24):
        if hour in hourly_temps:
            result.append(hourly_temps[hour])
    
    return result

def load_station_data(data_dir, station_id):
    """
    Load temperature data for a specific station directly using its station_id.
    
    Parameters:
    - data_dir: Directory containing station data files
    - station_id: ID of the station to load data for
    
    Returns:
    - DataFrame with daily temperature data
    """
    # Use filename pattern: "stationId_fromYear_toYear_avg_7d_over_years.csv"
    # Find the file that matches this pattern for the given station_id
    station_files = [f for f in os.listdir(data_dir) if f.startswith(f"{station_id}_") and f.endswith(".csv")]
    
    if not station_files:
        raise FileNotFoundError(f"No temperature data file found for station {station_id} in {data_dir}")
    
    # If multiple files match, use the first one (could be enhanced to select based on date range)
    file_path = os.path.join(data_dir, station_files[0])
    
    print(f"Using data file: {file_path}")
    
    data = pd.read_csv(file_path)
    
    # Parse dates in the format "%m-%d" and
    # use a leap year ensures all possible dates including February 29th are handled properly
    data['date'] = pd.to_datetime(data['date'] + f"-{LEAP_YEAR}", format="%m-%d-%Y")
    
    return data

def load_station_locations(input_file):
    """
    Load station location data (latitude, longitude, elevation) from input file.
    
    Parameters:
    - input_file: Path to the CSV file containing station location information
    
    Returns:
    - DataFrame with station_id, latitude, longitude, and elevation
    """
    return pd.read_csv(input_file)

def process_station_worker(station_row, data_dir, result_queue):
    """
    Worker function to process a station in a separate process.
    
    Parameters:
    - station_row: Row from stations DataFrame containing station information
    - data_dir: Directory containing daily temperature data files
    - result_queue: Queue to report results back to the main process
    """
    try:
        worker_id = mp.current_process().name
        worker_logger = logging.getLogger(f"{worker_id}")
        
        station_id = station_row['station_id']
        
        worker_logger.info(f"Processing station {station_id}")
        
        # Load this station's temperature data
        try:
            station_data = load_station_data(data_dir, station_id)
        except FileNotFoundError as e:
            worker_logger.warning(f"{e}")
            result_queue.put({
                'station_id': station_id,
                'status': 'error',
                'message': str(e),
                'daily_results': {}
            })
            return
            
        # Get all dates for this station
        station_dates = station_data['date'].dt.date.unique()
        
        worker_logger.info(f"Station {station_id} has {len(station_dates)} dates")
        
        # Create storage for this station's hourly data for all dates
        station_results = {}
        
        # Process each day for this station
        for date in sorted(station_dates):
            # Find the current day's data
            current_day = station_data[station_data['date'].dt.date == date]
            if current_day.empty:
                continue
            
            current_day = current_day.iloc[0]
            min_temp = current_day['tasmin']
            max_temp = current_day['tasmax']
            
            # Find previous day's data
            prev_day_max_temp = None
            prev_date = date - timedelta(days=1)
            prev_day_data = station_data[station_data['date'].dt.date == prev_date]
            if not prev_day_data.empty:
                prev_day_data = prev_day_data.iloc[0]
                prev_day_max_temp = prev_day_data['tasmax']
            
            # Find next day's data
            next_day_min_temp = None
            next_date = date + timedelta(days=1)
            next_day_data = station_data[station_data['date'].dt.date == next_date]
            if not next_day_data.empty:
                next_day_data = next_day_data.iloc[0]
                next_day_min_temp = next_day_data['tasmin']
            
            # Calculate solar times for this specific date and location
            try:
                lat = station_row['lat']
                lon = station_row['lon']
                elevation = station_row['elevation']
                
                sunrise_dt, noon_dt = calculate_sun_positions(lat, lon, elevation, date)
                
                # Interpolate hourly temperatures
                hourly_temps = interpolate_hourly_temperatures(
                    min_temp, max_temp,
                    sunrise_dt, noon_dt,
                    prev_day_max_temp, next_day_min_temp
                )
                
                # Store results for this date
                station_results[date] = hourly_temps
                
            except Exception as e:
                worker_logger.error(f"Error calculating sun positions for station {station_id} on {date}: {e}")
                continue
        
        # Create daily results for this station
        daily_results_by_date = {}
        for date, hourly_temps in station_results.items():
            # Prepare a row for each date's output file
            row = {'station_id': station_id}
            for hour, temp in enumerate(hourly_temps):
                row[f'hour_{hour}'] = temp
            
            # Store the row keyed by date
            date_str = date.strftime('%m%d')
            
            if date_str not in daily_results_by_date:
                daily_results_by_date[date_str] = []
            
            daily_results_by_date[date_str].append(row)
        
        # Put results in queue
        result_queue.put({
            'station_id': station_id,
            'status': 'success',
            'daily_results': daily_results_by_date
        })
        
    except Exception as e:
        worker_logger.error(f"Error processing station {station_id}: {e}")
        result_queue.put({
            'station_id': station_id,
            'status': 'error',
            'message': str(e),
            'daily_results': {}
        })

def process_weather_data(data_dir, locations_file, output_dir, output_prefix='hourly_temps'):
    """
    Process weather station data and interpolate hourly temperatures for each day.
    
    Parameters:
    - data_dir: Directory containing daily temperature data files
    - locations_file: Path to file with station location information
    - output_dir: Directory for output files
    """
    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    # Load station locations - this now contains all the information we need
    stations = load_station_locations(locations_file)
    
    # Create a shared manager for multiprocessing resources
    manager = Manager()
    result_queue = manager.Queue()
    
    # Determine the number of processes to use
    num_processes = mp.cpu_count() - 1  # Leave one CPU for the OS
    if num_processes < 1:
        num_processes = 1
    logger.info(f"Using {num_processes} CPU cores for parallel processing")
    
    # Dictionary to store results from all stations
    daily_results_by_date = {}
    
    # Track progress
    start_time = time.time()
    completed_stations = 0
    total_stations = len(stations)
    
    # Create a process pool and process stations in parallel
    with mp.Pool(processes=num_processes) as pool:
        # Submit all station processing tasks
        results = []
        for _, station_row in stations.iterrows():
            results.append(pool.apply_async(
                process_station_worker, 
                args=(station_row, data_dir, result_queue)
            ))
        
        # Process results as they become available
        with tqdm(total=total_stations, desc="Processing stations") as pbar:
            while completed_stations < total_stations:
                try:
                    # Get the next result with a timeout
                    result = result_queue.get(timeout=1)
                    
                    # Update tracking variables
                    completed_stations += 1
                    pbar.update(1)
                    
                    # If successful, add the station's results to our combined results
                    if result.get('status') == 'success':
                        station_daily_results = result.get('daily_results', {})
                        
                        # Merge station results into the main results dictionary
                        for date_str, rows in station_daily_results.items():
                            if date_str not in daily_results_by_date:
                                daily_results_by_date[date_str] = []
                            daily_results_by_date[date_str].extend(rows)
                    
                    # Log progress periodically
                    if completed_stations % 10 == 0 or completed_stations == total_stations:
                        elapsed = time.time() - start_time
                        logger.info(f"Progress: {completed_stations}/{total_stations} stations completed ({completed_stations/total_stations*100:.1f}%)")
                        
                except QueueEmpty:
                    # Queue timeout, just continue
                    continue
                except Exception as e:
                    logger.error(f"Error processing results: {str(e)}")
                    
        # Make sure all processes are done
        for r in results:
            r.wait()
    
    # Write output files for each date - use dictionary keys directly
    logger.info(f"Writing output files for {len(daily_results_by_date)} unique dates")
    for date_str, date_results in sorted(daily_results_by_date.items()):
        date_str_for_output = date_str[:2] + '_' + date_str[2:]
        output_file = os.path.join(output_dir, f"{output_prefix}_{date_str_for_output}.csv")
        
        # Convert to DataFrame and save
        if date_results:
            df = pd.DataFrame(date_results)
            df.to_csv(output_file, index=False, float_format='%.2f')
            logger.info(f"Saved results for {date_str} with {len(df)} stations")
    
    # Report completion
    total_time = time.time() - start_time
    logger.info(f"All processing complete! Processed {total_stations} stations in {timedelta(seconds=int(total_time))}")

def main():
    args = parse_arguments()
    process_weather_data(args.hyras_data, args.input_file, args.output_dir, args.output_prefix)
    logger.info(f"Results saved to {args.output_dir}")

if __name__ == '__main__':
    main()
