#!/usr/bin/env python3
# /home/sebastian/Projects/ziemlichwarmhier/playground/calculate_rolling_averages.py

import os
import re
import argparse
import pandas as pd
from pathlib import Path


def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Calculate rolling averages for climate data.')
    parser.add_argument('--data-dir', type=str, default='data',
                        help='Directory containing the CSV files')
    parser.add_argument('--from-year', type=int, required=True,
                        help='Start year for the output data')
    parser.add_argument('--to-year', type=int, required=True,
                        help='End year for the output data')
    parser.add_argument('--rolling-window', type=int, default=7,
                        help='Rolling window size in days (before and after)')
    parser.add_argument('--output-dir', type=str, default='output',
                        help='Directory for the output files')
    parser.add_argument('--over-years', action='store_true',
                        help='Calculate average over years for the same day')
    return parser.parse_args()


def process_file(file_path, from_year, to_year, rolling_window, output_dir, over_years=False):
    """Process a single CSV file and create rolling averages."""
    print(f"Processing {file_path.name}...")
    
    # Extract station ID from filename (filename without extension)
    station_id = file_path.stem
    
    # Read the CSV file
    df = pd.read_csv(file_path)
    
    # Ensure the date column is in datetime format
    if 'date' in df.columns:
        df['date'] = pd.to_datetime(df['date'])
    else:
        print(f"Skipping {file_path.name}: no date column found")
        return
    
    # Sort by date to ensure proper sequence for rolling calculations
    df = df.sort_values('date')
    
    # Get all metrics (all columns except date)
    metrics = [col for col in df.columns if col != 'date']
    
    # Step 1: Calculate rolling averages using all available data
    result_df = df.copy()
    window_size = 2 * rolling_window + 1  # window includes current day plus days before and after
    
    for metric in metrics:
        result_df[metric] = df[metric].rolling(window=window_size, center=True, min_periods=1).mean()
        # Round to 2 decimal places
        result_df[metric] = result_df[metric].round(2)
    
    # Step 2: Now filter to only include the specified year range in the output
    result_df = result_df[(result_df['date'].dt.year >= from_year) & 
                         (result_df['date'].dt.year <= to_year)]
    
    # Step 3: If over_years is enabled, calculate the average for each day of the year across years
    if over_years:
        # Add month-day column for grouping
        result_df['month_day'] = result_df['date'].dt.strftime('%m-%d')
        
        # Group by month-day and calculate mean across years
        over_years_df = result_df.groupby('month_day')[metrics].mean().reset_index()
        
        # Create dates for a leap year (e.g., 2020) to ensure proper date sorting and handle Feb 29
        base_year = 2020  # Using a leap year to handle February 29
        over_years_df['date'] = over_years_df['month_day'].apply(
            lambda x: pd.to_datetime(f"{base_year}-{x}", errors='coerce')
        )
        
        # Drop any rows with invalid dates (should not happen with leap year)
        over_years_df = over_years_df.dropna(subset=['date'])
        
        # Sort by the new date and drop the month_day column
        over_years_df = over_years_df.sort_values('date')
        over_years_df = over_years_df.drop('month_day', axis=1)
        
        # Remove the year from the date column, keep only month-day
        over_years_df['date'] = over_years_df['date'].dt.strftime('%m-%d')
        
        # Round to 2 decimal places again
        for metric in metrics:
            over_years_df[metric] = over_years_df[metric].round(2)
        
        # Update result_df to be the over-years averaged dataframe
        result_df = over_years_df
    
    # Ensure date column is the first column in the dataframe
    if 'date' in result_df.columns:
        cols = ['date'] + [col for col in result_df.columns if col != 'date']
        result_df = result_df[cols]
        
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Name the output file with the appropriate pattern
    if over_years:
        output_filename = f"{station_id}_{from_year}-{to_year}_avg_{rolling_window}d_over_years.csv"
    else:
        output_filename = f"{station_id}_{from_year}-{to_year}_avg_{rolling_window}d.csv"
    
    output_path = os.path.join(output_dir, output_filename)
    
    # Save the result
    result_df.to_csv(output_path, index=False)
    print(f"Created {output_path}")


def main():
    """Main function to process all CSV files."""
    args = parse_arguments()
    
    data_dir = Path(args.data_dir)
    output_dir = Path(args.output_dir)
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Find all CSV files in the directory
    csv_files = list(data_dir.glob('*.csv'))
    
    if not csv_files:
        print(f"No CSV files found in {data_dir}")
        return
    
    print(f"Found {len(csv_files)} files to process")
    
    # Process each file
    for file_path in csv_files:
        process_file(
            file_path, 
            args.from_year, 
            args.to_year, 
            args.rolling_window, 
            output_dir,
            args.over_years
        )
    
    print("Processing complete!")


if __name__ == "__main__":
    main()