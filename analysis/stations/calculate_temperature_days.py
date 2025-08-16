#!/usr/bin/env python3

import os
import json
import argparse
import pandas as pd
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Calculate number of days above/below temperature thresholds for weather stations.')
    parser.add_argument('--stations-file', type=str, required=True,
                        help='CSV file containing station data with location information')
    parser.add_argument('--data-dir', type=str, required=True,
                        help='Directory containing daily temperature data files')
    parser.add_argument('--output-dir', type=str, required=True,
                        help='Directory for output JSON files')
    parser.add_argument('--threshold', type=float, default=30.0,
                        help='Temperature threshold in degrees Celsius (default: 30.0)')
    parser.add_argument('--mode', type=str, choices=['above', 'below'], default='above',
                        help='Count days above or below threshold (default: above)')
    parser.add_argument('--temp-column', type=str, default='tasmax',
                        help='Temperature column to use: tasmax, tasmin, or tasmean (default: tasmax)')
    return parser.parse_args()

def load_station_data(data_dir, station_id):
    """
    Load temperature data for a specific station.
    
    Parameters:
    - data_dir: Directory containing station data files
    - station_id: ID of the station to load data for
    
    Returns:
    - DataFrame with daily temperature data
    """
    # Find files that match the station pattern
    station_files = [f for f in os.listdir(data_dir) if f.startswith(f"{station_id}") and f.endswith(".csv")]
    
    if not station_files:
        raise FileNotFoundError(f"No temperature data file found for station {station_id} in {data_dir}")
    
    # Use the first matching file
    file_path = os.path.join(data_dir, station_files[0])
    
    data = pd.read_csv(file_path)
    
    data['date'] = pd.to_datetime(data['date'])
    
    return data

def load_station_locations(stations_file):
    """
    Load station location data.
    
    Parameters:
    - stations_file: Path to the CSV file containing station information
    
    Returns:
    - DataFrame with station information
    """
    return pd.read_csv(stations_file)

def calculate_threshold_days(station_data, threshold, mode, temp_column):
    """
    Calculate the number of days above or below a temperature threshold for each year.
    
    Parameters:
    - station_data: DataFrame with daily temperature data
    - threshold: Temperature threshold
    - mode: 'above' or 'below'
    - temp_column: Column name to use for temperature data
    
    Returns:
    - Dict with 'x' (years) and 'y' (day counts)
    """
    if temp_column not in station_data.columns:
        raise ValueError(f"Temperature column '{temp_column}' not found in data")
    
    # Extract year from date
    station_data['year'] = station_data['date'].dt.year
    
    # Group by year and count days meeting the threshold condition
    yearly_counts = []
    years = sorted(station_data['year'].unique())
    
    for year in years:
        year_data = station_data[station_data['year'] == year]
        
        if mode == 'above':
            count = (year_data[temp_column] > threshold).sum()
        else:  # mode == 'below'
            count = (year_data[temp_column] < threshold).sum()
        
        yearly_counts.append(int(count))  # Convert to native Python int
    
    return {
        'x': [int(year) for year in years],  # Convert to native Python ints
        'y': yearly_counts
    }

def process_station(station_row, data_dir, threshold, mode, temp_column):
    """
    Process a single station and calculate temperature threshold days.
    
    Parameters:
    - station_row: Row containing station information
    - data_dir: Directory containing temperature data files
    - threshold: Temperature threshold
    - mode: 'above' or 'below'
    - temp_column: Temperature column to use
    
    Returns:
    - Dict with results or None if processing failed
    """
    station_id = station_row['station_id']
    
    try:
        # Load station data
        station_data = load_station_data(data_dir, station_id)
        
        # Calculate threshold days
        results = calculate_threshold_days(station_data, threshold, mode, temp_column)
        
        logger.info(f"Processed station {station_id}: {len(results['x'])} years of data")
        return results
        
    except Exception as e:
        logger.error(f"Error processing station {station_id}: {e}")
        return None

def generate_output_filename(station_id, threshold, mode, temp_column):
    """
    Generate output filename based on station ID, threshold, and mode.
    
    Parameters:
    - station_id: Station identifier
    - threshold: Temperature threshold
    - mode: 'above' or 'below'
    - temp_column: Temperature column to use
    
    Returns:
    - String filename
    """
    threshold_str = str(int(threshold)) if threshold == int(threshold) else str(threshold).replace('.', '_')
    temp_column_str = temp_column.replace('tas', 'T')  # e.g., tasmax -> Tmax

    if mode == 'above':
        return f"{station_id}_daysAbove{threshold_str}{temp_column_str}Historical.json"
    else:
        return f"{station_id}_daysBelow{threshold_str}{temp_column_str}Historical.json"

def main():
    """Main function to process all stations."""
    args = parse_arguments()
    
    # Ensure output directory exists
    os.makedirs(args.output_dir, exist_ok=True)
    
    # Load station information
    logger.info(f"Loading station data from {args.stations_file}")
    stations = load_station_locations(args.stations_file)
    
    logger.info(f"Found {len(stations)} stations to process")
    logger.info(f"Counting days {args.mode} {args.threshold}°C using column '{args.temp_column}'")
    
    processed_count = 0
    error_count = 0
    
    # Process each station
    for _, station_row in stations.iterrows():
        station_id = station_row['station_id']
        
        # Process station
        results = process_station(station_row, args.data_dir, args.threshold, args.mode, args.temp_column)
        
        if results is not None:
            # Generate output filename
            output_filename = generate_output_filename(station_id, args.threshold, args.mode, args.temp_column)
            output_path = os.path.join(args.output_dir, output_filename)
            
            # Save results as JSON
            with open(output_path, 'w') as f:
                json.dump(results, f, indent=2)
            
            processed_count += 1
            logger.info(f"Saved results for station {station_id} to {output_filename}")
        else:
            error_count += 1
    
    # Report completion
    logger.info(f"Processing complete! Successfully processed {processed_count} stations, {error_count} errors")
    logger.info(f"Results saved to {args.output_dir}")

if __name__ == '__main__':
    main()
