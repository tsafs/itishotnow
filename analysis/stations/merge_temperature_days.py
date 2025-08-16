#!/usr/bin/env python3

import os
import json
import argparse
import logging
from pathlib import Path
from collections import defaultdict

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Merge multiple temperature threshold JSON files into single files per station.')
    parser.add_argument('--input-dirs', type=str, nargs='+', required=True,
                        help='List of input directories containing temperature threshold JSON files')
    parser.add_argument('--output-dir', type=str, required=True,
                        help='Directory for merged output JSON files')
    parser.add_argument('--output-suffix', type=str, required=True,
                        help='Suffix to apply to output filenames (e.g., "Minus10_0_25_30_Historical")')
    return parser.parse_args()

def extract_station_id_from_filename(filename):
    """
    Extract station ID from filename.
    Assumes format: stationId_daysXXXXHistorical.json
    
    Parameters:
    - filename: Name of the file
    
    Returns:
    - station_id or None if extraction fails
    """
    base_name = filename.replace('.json', '')
    
    # Find the first occurrence of '_days' and extract everything before it
    if '_days' in base_name:
        return base_name.split('_days')[0]
    
    return None

def create_key_from_filename(filename):
    """
    Create a key from filename by removing the station ID prefix and .json extension.
    
    Parameters:
    - filename: Name of the file
    
    Returns:
    - Key for the merged JSON
    """
    base_name = filename.replace('.json', '')
    
    # Remove station ID prefix (everything up to and including the first '_days')
    if '_days' in base_name:
        return 'days' + base_name.split('_days', 1)[1].replace('Historical', '')
    
    return base_name

def load_json_data(file_path):
    """
    Load data from a JSON file.
    
    Parameters:
    - file_path: Path to the JSON file
    
    Returns:
    - Dict with JSON data or None if loading fails
    """
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading {file_path}: {e}")
        return None

def collect_station_files(input_dirs):
    """
    Collect all JSON files organized by station ID.
    
    Parameters:
    - input_dirs: List of directories containing JSON files
    
    Returns:
    - Dict mapping station_id to list of file paths
    """
    station_files = defaultdict(list)
    
    for input_dir in input_dirs:
        input_path = Path(input_dir)
        
        if not input_path.exists():
            logger.warning(f"Input directory {input_dir} does not exist")
            continue
            
        # Find all JSON files in the directory
        json_files = list(input_path.glob('*.json'))
        
        logger.info(f"Found {len(json_files)} JSON files in {input_dir}")
        
        for json_file in json_files:
            station_id = extract_station_id_from_filename(json_file.name)
            
            if station_id:
                station_files[station_id].append(json_file)
            else:
                logger.warning(f"Could not extract station ID from filename: {json_file.name}")
    
    return station_files

def merge_station_data(station_files):
    """
    Merge all JSON files for a single station.
    
    Parameters:
    - station_files: List of file paths for a station
    
    Returns:
    - Dict with merged data using filenames as keys
    """
    merged_data = {}
    
    for file_path in station_files:
        # Load the JSON data
        data = load_json_data(file_path)
        
        if data is not None:
            # Create key from filename
            key = create_key_from_filename(file_path.name)
            
            # Store data under the filename-based key
            merged_data[key] = data
        
    return merged_data

def main():
    """Main function to merge temperature threshold data."""
    args = parse_arguments()
    
    # Ensure output directory exists
    os.makedirs(args.output_dir, exist_ok=True)
    
    # Collect all station files from input directories
    logger.info("Collecting station files from input directories...")
    station_files = collect_station_files(args.input_dirs)
    
    logger.info(f"Found data for {len(station_files)} stations")
    
    if not station_files:
        logger.error("No valid station files found")
        return
    
    # Process each station
    processed_count = 0
    error_count = 0
    
    for station_id, files in station_files.items():
        logger.info(f"Processing station {station_id} ({len(files)} files)")
        
        try:
            # Merge all JSON files for this station
            merged_data = merge_station_data(files)
            
            if merged_data:
                # Save merged data
                output_file = os.path.join(args.output_dir, f"{station_id}_{args.output_suffix}.json")
                
                with open(output_file, 'w') as f:
                    json.dump(merged_data, f, indent=2)
                
                processed_count += 1
                logger.info(f"Saved merged data for station {station_id}: {len(merged_data)} metrics -> {output_file}")
            else:
                logger.error(f"No valid data found for station {station_id}")
                error_count += 1
                
        except Exception as e:
            logger.error(f"Error processing station {station_id}: {e}")
            error_count += 1
    
    # Report completion
    logger.info(f"Merging complete! Successfully processed {processed_count} stations, {error_count} errors")
    logger.info(f"Results saved to {args.output_dir}")

if __name__ == '__main__':
    main()
