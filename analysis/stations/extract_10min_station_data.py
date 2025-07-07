#!/usr/bin/env python3

import argparse
import csv
import re
import datetime
from pathlib import Path


def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Extract 10-minute station data into a csv file and calculate statistics.')
    parser.add_argument('--data-dir', type=str, 
                        default='./data/stations/10min/now',
                        help='Directory containing the 10-minute station data files')
    parser.add_argument('--output-file', type=str, 
                        default='station_10min_data.csv',
                        help='Path for the output CSV file')
    parser.add_argument('--reference-date', type=str,
                        default=datetime.date.today().strftime('%Y%m%d'),
                        help='Reference date for checking data availability (YYYYMMDD)')
    parser.add_argument('--invalid-value', type=str,
                        default='-999',
                        help='Value indicating invalid data')
    return parser.parse_args()


def read_station_descriptions(data_dir):
    """Read and parse station descriptions from the input file within data directory."""
    input_file = Path(data_dir) / 'zehn_now_tu_Beschreibung_Stationen.txt'
    print(f"Reading station descriptions from {input_file}")
    
    try:
        with open(input_file, encoding='latin1') as f:
            lines = f.readlines()
        
        # Skip header lines (first 2)
        data_lines = lines[2:]
        
        stations = []
        for line in data_lines:
            line = line.strip()
            if not line:
                continue
            
            # Fixed width format extraction
            # Extract fields based on fixed positions in the line
            try:
                station_id = line[0:6].strip().lstrip('0')
                hoehe = line[34:38].strip()
                geoBreite = line[38:50].strip()
                geoLaenge = line[50:61].strip()
                station_name = line[61:102].strip()
                
                stations.append({
                    'station_id': station_id,
                    'station_name': station_name,
                    'hoehe': hoehe,
                    'geoBreite': geoBreite,
                    'geoLaenge': geoLaenge
                })
            except Exception as e:
                print(f"Error parsing line: {line}")
                print(f"Error details: {e}")
        
        print(f"Found {len(stations)} stations in description file")
        return stations
    
    except Exception as e:
        print(f"Error reading station descriptions: {e}")
        return []


def find_recent_data_files(data_dir):
    """Find all recent 10-minute data files for stations."""
    print(f"Looking for recent 10-minute data files in {data_dir}")
    data_dir_path = Path(data_dir)
    
    if not data_dir_path.exists():
        print(f"Data directory {data_dir} does not exist")
        return {}
    
    # Pattern for 10-minute data: produkt_zehn_now_tu_YYYYMMDD_YYYYMMDD_XXXXX.txt or
    # produkt_zehn_akt_tu_YYYYMMDD_YYYYMMDD_XXXXX.txt
    file_pattern = re.compile(r'produkt_zehn_(?:now|akt)_tu_\d+_\d+_(\d+)\.txt')
    
    station_files = {}
    
    for subdir in data_dir_path.glob('*'):
        if subdir.is_dir():
            for file_path in subdir.glob('*.txt'):
                match = file_pattern.match(file_path.name)
                if match:
                    station_id = match.group(1)
                    # Store with leading zeros stripped to match station IDs in description
                    station_id_clean = station_id.lstrip('0')
                    station_files[station_id_clean] = file_path
    
    print(f"Found recent data files for {len(station_files)} stations")
    return station_files


def process_station_data(file_path, reference_date, invalid_value):
    """Process 10-minute station data to extract statistics."""
    try:
        ref_date_str = reference_date
        
        # Fixed column names for 10-minute data
        check_columns = ['TT_10', 'RF_10']  # Temperature and humidity
        output_columns = ['temperature', 'humidity']
        column_mapping = dict(zip(check_columns, output_columns))
        
        # Dictionary to store latest valid data and statistics
        latest_data = {}
        temperature_values = []
        
        with open(file_path, 'r', encoding='latin1') as f:  # Using latin1 for DWD files
            # Read header to get column positions
            header_line = f.readline().strip()
            columns = [col.strip() for col in header_line.split(';')]
            
            # Find positions of columns to check
            check_indices = {}
            for col in check_columns:
                if col in columns:
                    check_indices[col] = columns.index(col)
                else:
                    print(f"Warning: Column {col} not found in data file {file_path.name}")
            
            if not check_indices:
                print(f"No valid columns to check in {file_path.name}")
                return False, {}
            
            # Read data from the file
            for line in f:
                if line.startswith('eor') or not line.strip():
                    continue
                
                parts = line.strip().split(';')
                if len(parts) < 2:
                    continue
                
                date_str = parts[1].strip()
                
                # Handle 10min data format (YYYYMMDDHHMM)
                # Extract just the date part for comparison
                if len(date_str) >= 8:
                    date_str_for_comparison = date_str[:8]
                    
                    # Check if this date matches our reference date
                    if date_str_for_comparison == ref_date_str:
                        # Process temperature values for min/max calculation
                        if 'TT_10' in check_indices:
                            temp_idx = check_indices['TT_10']
                            if temp_idx < len(parts):
                                temp_str = parts[temp_idx].strip()
                                # Improved validation: Check that the value is not the invalid value and is actually numeric
                                if temp_str != invalid_value and temp_str:
                                    try:
                                        temp_value = float(temp_str)
                                        # Additional check to filter out potentially invalid values
                                        if -100 <= temp_value <= 100:  # Reasonable temperature range in Celsius
                                            temperature_values.append(temp_value)
                                    except ValueError:
                                        # Skip invalid numbers
                                        pass
                        
                        # Process latest data for each column
                        for col, idx in check_indices.items():
                            if idx < len(parts) and parts[idx].strip() != invalid_value:
                                output_col = column_mapping[col]
                                latest_data[output_col] = {
                                    'date': date_str,
                                    'value': parts[idx].strip()
                                }
        
        # Calculate min and max temperature if we have values
        if temperature_values:
            latest_data['min_temperature'] = {
                'date': ref_date_str,
                'value': str(min(temperature_values))
            }
            latest_data['max_temperature'] = {
                'date': ref_date_str,
                'value': str(max(temperature_values))
            }
        
        has_valid_data = bool(latest_data)
        return has_valid_data, latest_data
    
    except Exception as e:
        print(f"Error processing station data in {file_path}: {e}")
        return False, {}


def write_results_to_csv(stations, output_file):
    """Write processed stations to CSV file including data points."""
    with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['station_id', 'station_name', 'data_date', 'elevation', 'lat', 'lon']
        
        # Add data point fields for any metrics that might be present
        metric_fields = set()
        for station in stations:
            if 'latest_data' in station:
                for metric in station['latest_data'].keys():
                    metric_fields.add(f"{metric}")
        
        all_fields = fieldnames + sorted(list(metric_fields))
        writer = csv.DictWriter(csvfile, fieldnames=all_fields)
        writer.writeheader()
        
        for station in stations:
            row_data = {
                'station_id': station['station_id'],
                'station_name': station['station_name'],
                'elevation': station['hoehe'],
                'lat': station['geoBreite'],
                'lon': station['geoLaenge']
            }
            
            # Add data points if available
            if 'latest_data' in station:
                for metric, data in station['latest_data'].items():
                    row_data[f"{metric}"] = data['value']
                
                # Add data_date to row_data in DD.MM.YYYY HH:MM format
                # Take it from TT_10 value
                if 'temperature' in station['latest_data']:
                    data_date = station['latest_data']['temperature']['date']
                    row_data['data_date'] = datetime.datetime.strptime(data_date, '%Y%m%d%H%M').strftime('%d.%m.%Y %H:%M')

            
            writer.writerow(row_data)
    
    print(f"Wrote {len(stations)} stations to {output_file}")


def extract_10min_station_data(data_dir, reference_date, invalid_value, output_file):
    """Main function to extract and process 10-minute station data."""
    
    # Read station descriptions from the data directory
    stations = read_station_descriptions(data_dir)
    
    # Get recent data files and latest pull date
    station_files = find_recent_data_files(data_dir)
    
    # Process stations based on data availability
    processed_stations = []
    print(f"Processing stations with data on reference date: {reference_date}")
    print(f"Checking for valid data in columns: TT_10 (temperature), RF_10 (humidity)")
    
    for station in stations:
        station_id = station['station_id']
        station_id = station_id.lstrip('0')  # Ensure leading zeros are stripped for matching
        
        if station_id in station_files:
            has_valid_data, latest_data = process_station_data(
                station_files[station_id], 
                reference_date,
                invalid_value
            )
            
            if has_valid_data:
                # Add the latest data to the station record
                station['latest_data'] = latest_data
                processed_stations.append(station)
                print(f"Station {station_id} processed successfully")
            else:
                print(f"Station {station_id} has no valid data for the reference date")
        else:
            print(f"Station {station_id} has no 10-minute data file")
    
    print(f"Processed {len(processed_stations)} stations with valid data")
    
    # Write results to CSV
    write_results_to_csv(processed_stations, output_file)
    
    print("Processing complete!")

def main():
    args = parse_arguments()
    extract_10min_station_data(
        args.data_dir,
        args.reference_date,
        args.invalid_value,
        args.output_file
    )


if __name__ == "__main__":
    main()
