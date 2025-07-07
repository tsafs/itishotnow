#!/usr/bin/env python3

import argparse
import csv
import re
import datetime
from pathlib import Path


def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Extract station data into a csv file and remove inactive stations.')
    parser.add_argument('--input-file', type=str, 
                        default='./data/KL_Tageswerte_Beschreibung_Stationen.txt',
                        help='Path to the stations description file')
    parser.add_argument('--output-file', type=str, 
                        default='station_date_ranges.csv',
                        help='Path for the output CSV file')
    parser.add_argument('--data-dir', type=str, 
                        default='./data/stations_daily/kl_recent',
                        help='Directory containing the recent station data files')
    parser.add_argument('--reference-date', type=str,
                        default=datetime.date.today().strftime('%Y%m%d'),
                        help='Reference date for checking data availability (YYYYMMDD)')
    parser.add_argument('--max-days-offset', type=int,
                        default=30,
                        help='Maximum days offset from reference date to consider a station active')
    parser.add_argument('--invalid-value', type=str,
                        default='-999',
                        help='Value indicating invalid data')
    parser.add_argument('--check-columns', type=str,
                        default='TMK,TXK,TNK,UPM',
                        help='Comma-separated list of columns to check for valid data')
    return parser.parse_args()


def read_station_descriptions(input_file, encoding='latin1'):
    """Read and parse station descriptions from the input file."""
    print(f"Reading station descriptions from {input_file}")
    try:
        with open(input_file, encoding=encoding) as f:
            lines = f.readlines()
        
        # Skip header lines (first 2)
        data_lines = lines[2:]
        
        stations = []
        for line in data_lines:
            # Use regex to split by whitespace, but keep station names with spaces together
            parts = re.split(r'\s+', line.strip(), maxsplit=7)
            if len(parts) < 7:
                continue
            
            station_id = parts[0]
            von_datum = parts[1]
            bis_datum = parts[2]
            geoBreite = parts[4]
            geoLaenge = parts[5]
            station_name = parts[6]
            
            stations.append({
                'station_id': station_id,
                'station_name': station_name,
                'von_datum': von_datum,
                'bis_datum': bis_datum,
                'geoBreite': geoBreite,
                'geoLaenge': geoLaenge
            })
        
        print(f"Found {len(stations)} stations in description file")
        return stations
    
    except Exception as e:
        print(f"Error reading station descriptions: {e}")
        return []


def find_recent_data_files(data_dir):
    """Find all recent data files for stations."""
    print(f"Looking for recent data files in {data_dir}")
    data_dir_path = Path(data_dir)
    
    if not data_dir_path.exists():
        print(f"Data directory {data_dir} does not exist")
        return {}
    
    # Pattern: produkt_klima_tag_YYYYMMDD_YYYYMMDD_XXXXX.txt
    file_pattern = re.compile(r'produkt_[a-z_]+_\d+_\d+_(\d+)\.txt')
    
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


def check_station_data(file_path, reference_date, max_days_offset, invalid_value, check_columns):
    """Check if a station has valid data near the reference date and extract latest valid data points."""
    try:
        ref_date = datetime.datetime.strptime(reference_date, '%Y%m%d').date()
        earliest_valid_date = (ref_date - datetime.timedelta(days=max_days_offset)).strftime('%Y%m%d')
        
        # Dictionary to track latest valid data for each column
        latest_valid_data = {col: {'date': None, 'value': None} for col in check_columns}
        
        with open(file_path, 'r') as f:
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
            
            # Read through the file from the end to find the most recent data
            lines = f.readlines()
            has_valid_recent_data = False
            
            for line in reversed(lines):
                if line.startswith('eor') or not line.strip():
                    continue
                
                parts = line.strip().split(';')
                if len(parts) < 2:
                    continue
                
                date_str = parts[1]
                
                # Check if this date is within our range
                if date_str < earliest_valid_date:
                    # We've gone back too far
                    break
                
                # Check each column for valid data
                for col, idx in check_indices.items():
                    if idx < len(parts) and parts[idx].strip() != invalid_value:
                        # If we haven't recorded valid data for this column yet
                        if latest_valid_data[col]['date'] is None:
                            latest_valid_data[col]['date'] = date_str
                            latest_valid_data[col]['value'] = parts[idx].strip()
                            has_valid_recent_data = True
            
        return has_valid_recent_data, latest_valid_data
    except Exception as e:
        print(f"Error checking station data in {file_path}: {e}")
        return False, {}


def write_results_to_csv(stations, output_file):
    """Write filtered stations to CSV file including latest data points."""
    with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['station_id', 'station_name', 'from_date', 'to_date', 'lat', 'lon']
        
        # Add data point fields for any metrics that might be present
        metric_fields = set()
        for station in stations:
            if 'latest_data' in station:
                for metric in station['latest_data'].keys():
                    metric_fields.add(f"{metric}_latest_date")
                    metric_fields.add(f"{metric}_latest_value")
        
        all_fields = fieldnames + sorted(list(metric_fields))
        writer = csv.DictWriter(csvfile, fieldnames=all_fields)
        writer.writeheader()
        
        for station in stations:
            row_data = {
                'station_id': station['station_id'],
                'station_name': station['station_name'],
                'from_date': station['von_datum'],
                'to_date': station['bis_datum'],
                'lat': station['geoBreite'],
                'lon': station['geoLaenge']
            }
            
            # Add latest data points if available
            if 'latest_data' in station:
                for metric, data in station['latest_data'].items():
                    if data['date'] is not None:
                        row_data[f"{metric}_latest_date"] = data['date']
                        row_data[f"{metric}_latest_value"] = data['value']
            
            writer.writerow(row_data)
    
    print(f"Wrote {len(stations)} stations to {output_file}")


def main():
    """Main function to extract and filter station data."""
    args = parse_arguments()
    
    # Read station descriptions
    stations = read_station_descriptions(args.input_file)
    
    # Get recent data files
    station_files = find_recent_data_files(args.data_dir)
    
    # Check which columns to validate
    check_columns = args.check_columns.split(',')
    
    # Filter stations based on recent data availability
    filtered_stations = []
    print(f"Filtering stations with data since {args.reference_date} (max offset: {args.max_days_offset} days)")
    print(f"Checking for valid data in columns: {', '.join(check_columns)}")
    
    for station in stations:
        station_id = station['station_id']
        station_id = station_id.lstrip('0')  # Ensure leading zeros are stripped for matching
        
        if station_id in station_files:
            has_valid_data, latest_data = check_station_data(
                station_files[station_id], 
                args.reference_date,
                args.max_days_offset,
                args.invalid_value,
                check_columns
            )
            
            if has_valid_data:
                # Add the latest data to the station record
                station['latest_data'] = latest_data
                filtered_stations.append(station)
                print(f"Station {station_id} passed data validation")
            else:
                print(f"Station {station_id} failed data validation - no recent valid data")
        else:
            print(f"Station {station_id} failed data validation - no data file found")
    
    print(f"Filtered down to {len(filtered_stations)} active stations")
    
    # Write results to CSV
    write_results_to_csv(filtered_stations, args.output_file)
    
    print("Processing complete!")


if __name__ == "__main__":
    main()