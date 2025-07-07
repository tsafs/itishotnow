#!/usr/bin/env python3

import os
import sys
import datetime
import argparse
import pandas as pd

# Direct imports of functions from other scripts
from fetch_station_data import fetch_station_data
from extract_10min_station_data import extract_10min_station_data
from download_from_s3 import download_file
from filter_10min_station_data_by_hyras import filter_10min_station_data_by_hyras
from upload_to_s3 import upload_file


def process_live_weather_data():
    """Process current weather station data and return the output file path."""
    # Get current date in YYYYMMDD format
    today = datetime.datetime.now().strftime("%Y%m%d")
    print(f"Starting data collection and processing for date: {today}")
    
    # Download previous station data file from today if it exists
    bucket_name = os.environ.get("BUCKET_NAME")
    region = os.environ.get("REGION")
    endpoint_url = os.environ.get("ENDPOINT_URL")
    
    # Check if environment variables are set
    if not (bucket_name and region and endpoint_url):
        print("Error: Required environment variables not set (BUCKET_NAME, REGION, ENDPOINT_URL)")
        sys.exit(1)
        
    s3_file_path = f"station_data/10min_station_data_{today}.csv"
    local_prev_dir = "./data/previous"
    os.makedirs(local_prev_dir, exist_ok=True)
    local_prev_file = f"{local_prev_dir}/previous_10min_station_data_{today}.csv"
    
    print("Checking for previous station data file from today...")
    try:
        download_file(bucket_name, s3_file_path, local_prev_file, region, endpoint_url)
        print(f"Previous file from today found and downloaded to {local_prev_file}")
    except Exception as e:
        print(f"No previous file from today found: {str(e)}")
    
    # 1. Fetch 10-minute station data
    print("Fetching 10-minute station data...")
    try:
        fetch_station_data("./data", "10min", "now")
    except Exception as e:
        print(f"Error: Failed to fetch station data - {str(e)}")
        sys.exit(1)

    # 2. Extract and process the data
    print("Extracting and processing station data...")
    unfiltered_output_file = f"./data/now/unfiltered_10min_station_data_{today}.csv"
    output_file = f"./data/now/10min_station_data_{today}.csv"
    
    try:
        extract_10min_station_data(
            data_dir="./data/now", 
            reference_date=today, 
            output_file=unfiltered_output_file,
            invalid_value=-999
        )
    except Exception as e:
        print(f"Error: Failed to extract station data - {str(e)}")
        sys.exit(1)

    # 3. Check if the output file was created
    if not os.path.isfile(unfiltered_output_file):
        print(f"Error: Output file {unfiltered_output_file} was not created!")
        sys.exit(1)

    # 4. Fetch the reference file from the S3 bucket
    print("Fetching reference file from S3...")
    
    # Create directory for reference file
    os.makedirs("./data/reference", exist_ok=True)
    
    reference_file = "./data/reference/hyras_stations.csv"
    bucket_name = os.environ.get("BUCKET_NAME")
    region = os.environ.get("REGION")
    endpoint_url = os.environ.get("ENDPOINT_URL")
    
    # Check if environment variables are set
    if not (bucket_name and region and endpoint_url):
        print("Error: Required environment variables not set (BUCKET_NAME, REGION, ENDPOINT_URL)")
        sys.exit(1)
    
    try:
        download_file(bucket_name, "data/hyras_stations.csv", reference_file, region, endpoint_url)
    except Exception as e:
        print(f"Error: Failed to fetch reference file from S3 - {str(e)}")
        sys.exit(1)
    
    if not os.path.isfile(reference_file):
        print(f"Error: Reference file {reference_file} was not downloaded!")
        sys.exit(1)
    
    print(f"Reference file successfully downloaded to {reference_file}")

    # 5. Filter the data by reference file
    try:
        filter_10min_station_data_by_hyras(
            station_data=unfiltered_output_file,
            reference_file=reference_file,
            output_file=output_file
        )
    except Exception as e:
        print(f"Error: Failed to filter station data - {str(e)}")
        sys.exit(1)
    
    print(f"Data processing complete. Output saved to {output_file}")

    # 6. Upload to S3
    print("Uploading processed data to S3...")
    
    try:
        upload_file(output_file, bucket_name, region, endpoint_url, directory="station_data")
    except Exception as e:
        print(f"Error: Upload to S3 failed - {str(e)}")
        sys.exit(1)
    
    print("Upload to S3 completed successfully.")
    
    return output_file, reference_file


def process_hyras_rolling_avg_file(station_id, output_id, rolling_avg_file):
    """
    Process a single HYRAS rolling average file.
    
    Args:
        station_id: The station ID
        output_id: The output ID for the station
        rolling_avg_file: Path to the rolling average file
    """
    # Placeholder function - to be implemented later
    print(f"Processing HYRAS rolling average data for station {station_id} (output_id: {output_id})")
    print(f"  Using file: {rolling_avg_file}")
    # Actual processing would go here


def process_interpolated_hourly_temperatures(station_data_file, time_periods=None):
    """
    Process interpolated hourly temperature data and add historical mean columns to station data.
    
    Args:
        station_data_file: Path to the station data file
        time_periods: List of time periods to process (default: ["1961-1990", "1971-2000", "1981-2010"])
    
    Returns:
        Path to the updated station data file with historical mean columns added
    """
    if time_periods is None:
        time_periods = ["1961-1990", "1971-2000", "1981-2010"]
    
    print(f"Processing interpolated hourly temperatures for {len(time_periods)} time periods")
    
    # 1. Load the station data
    try:
        station_data = pd.read_csv(station_data_file)
        print(f"Loaded station data with {len(station_data)} stations")
    except Exception as e:
        print(f"Error: Failed to load station data - {str(e)}")
        return station_data_file
    
    bucket_name = os.environ.get("BUCKET_NAME")
    region = os.environ.get("REGION")
    endpoint_url = os.environ.get("ENDPOINT_URL")
    
    # Initialize columns for historical means
    for period in time_periods:
        column_name = f"hist_mean_{period.replace('-', '_')}"
        station_data[column_name] = None
    
    # 2. Extract date and hour from station data
    station_data['data_date'] = pd.to_datetime(station_data['data_date'], format='%m.%d.%Y %H:%M')
    station_data['month'] = station_data['data_date'].dt.month
    station_data['day'] = station_data['data_date'].dt.day
    station_data['hour'] = station_data['data_date'].dt.hour
    
    # Group by month and day to minimize the number of downloads
    date_groups = station_data.groupby(['month', 'day'])
    
    # Create temp directory for downloaded files
    temp_dir = "./data/interpolated_temps"
    os.makedirs(temp_dir, exist_ok=True)
    
    # Process each date group
    for (day, month), group_data in date_groups:
        month_str = f"{month:02d}"
        day_str = f"{day:02d}"
        
        # Download interpolated temperature files for each time period
        interpolated_files = {}
        
        for period in time_periods:
            period_start = period.split("-")[0]
            period_end = period.split("-")[1]
            
            # S3 path: data/1961_1990/hyras_interpolated_hourly_temperatures/interpolated_hourly_temperatures_1961_1990_01_01.csv
            file_name = f"interpolated_hourly_temperatures_{period_start}_{period_end}_{month_str}_{day_str}.csv"
            s3_path = f"data/interpolated_hourly/{period_start}_{period_end}/{file_name}"
            local_path = f"{temp_dir}/{file_name}"
            
            try:
                download_file(bucket_name, s3_path, local_path, region, endpoint_url)
                interpolated_files[period] = pd.read_csv(local_path)
                print(f"Downloaded and loaded interpolated temperatures for {period} on {month_str}-{day_str}")
            except Exception as e:
                print(f"Warning: Failed to download interpolated temperatures for {period} on {month_str}-{day_str}: {str(e)}")
                interpolated_files[period] = None
        
        # Update station data with historical means
        for idx, row in group_data.iterrows():
            station_id = str(row['station_id']).lstrip('0')
            hour = row['hour']
            hour_col = f"hour_{hour}"
            
            for period in time_periods:
                column_name = f"hist_mean_{period.replace('-', '_')}"
                
                if interpolated_files[period] is not None and station_id in interpolated_files[period]['station_id'].astype(str).values:
                    # Find the row with matching station_id
                    station_row = interpolated_files[period][interpolated_files[period]['station_id'].astype(str) == station_id]
                    
                    if not station_row.empty and hour_col in station_row.columns:
                        # Get the historical mean temperature for this hour
                        hist_mean = station_row[hour_col].values[0]
                        station_data.loc[idx, column_name] = hist_mean
                    else:
                        station_data.loc[idx, column_name] = None
                else:
                    station_data.loc[idx, column_name] = None
    
    # Convert data_date back to original string format
    station_data['data_date'] = station_data['data_date'].dt.strftime('%d.%m.%Y %H:%M')
    
    # Remove the temporary columns used for processing
    station_data = station_data.drop(columns=['month', 'day', 'hour'])
    
    # 3. Save the updated station data
    updated_file = station_data_file.replace(".csv", "_with_hist_means.csv")
    station_data.to_csv(updated_file, index=False)
    print(f"Saved updated station data with historical means to {updated_file}")
    
    # 4. Upload the updated file to S3
    try:
        upload_file(updated_file, bucket_name, region, endpoint_url, directory="station_data")
        print(f"Uploaded updated station data to S3")
    except Exception as e:
        print(f"Error: Upload to S3 failed - {str(e)}")
    
    return updated_file


def process_data():
    """Process station data and return the output file path."""
    # Process the live weather station data
    output_file, reference_file = process_live_weather_data()
    
    # Process HYRAS data for new and updated stations
    updated_output_file = process_interpolated_hourly_temperatures(output_file)
    
    return updated_output_file


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Process station data and return output file path")
    parser.add_argument("--return-output-path", action="store_true", 
                       help="Print only the output file path (for use in other scripts)")
    args = parser.parse_args()
    
    output_file_path = process_data()
    
    if args.return_output_path:
        # Just print the path for use in other scripts
        print(output_file_path)
    else:
        print("Job completed successfully!")
