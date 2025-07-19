#!/usr/bin/env python
"""
Transform HYRAS station data into day-of-year files.

This script takes the output of extract_hyras_data.py (individual station CSV files) 
and transforms it into 366 files (one per day of the year), each containing data 
from all stations for that specific day, averaged over the specified year range.
"""
import argparse
import pandas as pd
import numpy as np
from pathlib import Path
import logging
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
    parser = argparse.ArgumentParser(
        description="Transform HYRAS station data into day-of-year files"
    )
    parser.add_argument('--input-dir', required=True, 
                        help='Directory containing station CSV files from extract_hyras_data.py')
    parser.add_argument('--output-dir', required=True, 
                        help='Output directory for day-of-year CSV files')
    parser.add_argument('--from-year', type=int, required=True, 
                        help='Start year for data averaging (inclusive)')
    parser.add_argument('--to-year', type=int, required=True, 
                        help='End year for data averaging (inclusive)')
    return parser.parse_args()


def load_station_data(file_path, from_year, to_year):
    """
    Load and process a single station file.
    
    Args:
        file_path: Path to the station CSV file
        from_year: Start year for filtering
        to_year: End year for filtering
        
    Returns:
        DataFrame with day of year as index and climate parameters as columns,
        or empty DataFrame if no valid data
    """
    try:
        # Extract station ID from filename (without extension)
        station_id = Path(file_path).stem
        
        # Read the data
        df = pd.read_csv(file_path)
        
        # Skip if empty
        if df.empty:
            return pd.DataFrame()
        
        # Convert date to datetime
        df['date'] = pd.to_datetime(df['date'])
        
        # Filter by year range - create a new DataFrame instead of a view
        filtered_df = df[(df['date'].dt.year >= from_year) & (df['date'].dt.year <= to_year)].copy()
        
        if filtered_df.empty:
            return pd.DataFrame()
        
        # Extract month and day for mm_dd format
        filtered_df['month'] = filtered_df['date'].dt.month
        filtered_df['day'] = filtered_df['date'].dt.day
        filtered_df['mm_dd'] = filtered_df['date'].dt.strftime('%m_%d')
        
        # Calculate averages by month and day
        # First select only numeric columns (excluding date, month, day, mm_dd)
        numeric_cols = filtered_df.select_dtypes(include=[np.number]).columns.tolist()
        for col in ['month', 'day']:
            if col in numeric_cols:
                numeric_cols.remove(col)
        
        # Group by mm_dd and calculate mean
        avg_by_day = filtered_df.groupby('mm_dd')[numeric_cols].mean().reset_index()
        
        # Format numeric columns to 1 decimal place
        for col in avg_by_day.select_dtypes(include=['float']).columns:
            avg_by_day[col] = avg_by_day[col].map(lambda x: round(x, 1))
        
        # Add station_id column
        avg_by_day['station_id'] = station_id
        
        return avg_by_day
    
    except Exception as e:
        logger.error(f"Error processing file {file_path}: {e}")
        return pd.DataFrame()


def main():
    """Main execution function."""
    args = parse_arguments()
    
    input_dir = Path(args.input_dir)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    from_year = args.from_year
    to_year = args.to_year
    
    # Find all CSV files in the input directory
    csv_files = list(input_dir.glob('*.csv'))
    
    if not csv_files:
        logger.error(f"No CSV files found in {input_dir}")
        return
    
    logger.info(f"Found {len(csv_files)} station files in {input_dir}")
    logger.info(f"Computing averages for years {from_year} to {to_year}")
    
    # Organize data by mm_dd
    day_data = {}
    
    # Process each station file sequentially
    for file_path in tqdm(csv_files, desc="Processing station files"):
        station_data = load_station_data(file_path, from_year, to_year)
        
        # Skip if no data was found
        if station_data.empty:
            continue
        
        # Add this station's data to the appropriate mm_dd collections
        for _, row in station_data.iterrows():
            mm_dd = row['mm_dd']
            
            if mm_dd not in day_data:
                day_data[mm_dd] = []
            
            # Create a dictionary for this station's data on this day
            station_row = {'station_id': row['station_id']}
            
            # Add all climate parameters
            for col in station_data.columns:
                if col not in ['mm_dd', 'station_id']:
                    station_row[col] = row[col]
            
            day_data[mm_dd].append(station_row)
    
    # Write data to files
    logger.info(f"Writing {len(day_data)} day files to {output_dir}")
    
    for mm_dd, stations in tqdm(day_data.items(), desc="Writing day files"):
        # Create DataFrame for this day
        day_df = pd.DataFrame(stations)
        
        # Make sure all numeric columns are formatted to 1 decimal place (.1f)
        for col in day_df.select_dtypes(include=['float']).columns:
            day_df[col] = day_df[col].map(lambda x: round(x, 1))
        
        # Write to file
        output_file = output_dir / f"{mm_dd}.csv"
        day_df.to_csv(output_file, index=False)
    
    logger.info(f"Transformation complete! Created {len(day_data)} day files.")
    
    # Check for leap day (02_29)
    if '02_29' in day_data:
        logger.info("Leap day (February 29) data is included.")
    else:
        logger.warning("No data found for leap day (February 29).")
    
    # Check for missing days
    all_days = []
    for month in range(1, 13):
        days_in_month = 31  # Default
        if month in [4, 6, 9, 11]:
            days_in_month = 30
        elif month == 2:
            days_in_month = 29  # Include leap day
            
        for day in range(1, days_in_month + 1):
            all_days.append(f"{month:02d}_{day:02d}")
    
    missing_days = set(all_days) - set(day_data.keys())
    if missing_days:
        logger.warning(f"Missing data for {len(missing_days)} days: {sorted(missing_days)}")
    else:
        logger.info("Data available for all days of the year.")


if __name__ == "__main__":
    main()
