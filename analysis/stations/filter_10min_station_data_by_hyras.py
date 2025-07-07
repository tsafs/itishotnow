#!/usr/bin/env python3

import argparse
import csv
from pathlib import Path


def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Filter 10-minute station data based on HYRAS reference stations.')
    parser.add_argument('--station-data', type=str, 
                        default='station_10min_data.csv',
                        help='Path to the station data CSV file')
    parser.add_argument('--reference-file', type=str, 
                        default='hyras_stations.csv',
                        help='Path to the HYRAS reference stations CSV file')
    parser.add_argument('--output-file', type=str, 
                        default='filtered_station_data.csv',
                        help='Path for the filtered output CSV file')
    return parser.parse_args()


def read_reference_stations(reference_file):
    """Read and parse reference stations from the HYRAS CSV file."""
    print(f"Reading reference stations from {reference_file}")
    
    try:
        reference_stations = set()
        with open(reference_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Convert to string and strip leading zeros to match station ID format in both files
                station_id = str(row.get('station_id', '')).lstrip('0')
                if station_id:
                    reference_stations.add(station_id)
        
        print(f"Found {len(reference_stations)} reference stations")
        return reference_stations
    
    except Exception as e:
        print(f"Error reading reference stations: {e}")
        return set()


def filter_station_data(station_data_file, reference_stations):
    """Filter station data based on reference stations list."""
    print(f"Filtering station data from {station_data_file}")
    
    try:
        filtered_data = []
        total_stations = 0
        
        with open(station_data_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            headers = reader.fieldnames
            
            for row in reader:
                total_stations += 1
                # Strip leading zeros to match reference station format
                station_id = str(row.get('station_id', '')).lstrip('0')
                if station_id in reference_stations:
                    filtered_data.append(row)
        
        print(f"Total stations before filtering: {total_stations}")
        print(f"Filtered {len(filtered_data)} stations from input data")
        print(f"Excluded {total_stations - len(filtered_data)} stations")
        
        return headers, filtered_data
    
    except Exception as e:
        print(f"Error filtering station data: {e}")
        return None, []


def write_filtered_data(headers, filtered_data, output_file):
    """Write filtered station data to CSV file."""
    try:
        with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=headers)
            writer.writeheader()
            
            for row in filtered_data:
                writer.writerow(row)
        
        print(f"Wrote {len(filtered_data)} filtered stations to {output_file}")
        return True
    
    except Exception as e:
        print(f"Error writing filtered data: {e}")
        return False


def filter_10min_station_data_by_hyras(station_data, reference_file, output_file):
    """Main function to filter station data based on station_data, reference_file stations."""
    args = parse_arguments()
    
    # Read reference stations
    reference_stations = read_reference_stations(reference_file)
    
    if not reference_stations:
        print("No reference stations found. Exiting.")
        return
    
    # Filter station data based on reference stations
    headers, filtered_data = filter_station_data(station_data, reference_stations)
    
    if not headers or not filtered_data:
        print("No data to write after filtering. Exiting.")
        return
    
    # Write filtered data to output file
    success = write_filtered_data(headers, filtered_data, output_file)
    
    if success:
        print("Filtering complete!")
    else:
        print("Filtering failed.")

def main():
    args = parse_arguments()
    filter_10min_station_data_by_hyras(
        station_data=args.station_data,
        reference_file=args.reference_file,
        output_file=args.output_file
    )


if __name__ == "__main__":
    main()
