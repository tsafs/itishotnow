#!/usr/bin/env python3

import os
import sys
import datetime
import argparse
from pathlib import Path
import pandas as pd

# Direct imports of functions from other scripts
from fetch_station_data import fetch_station_data
from extract_daily_station_data import extract_daily_station_data
from upload_to_s3 import upload_file


def process_daily_weather_data():
    """Process daily weather station data and return the output file path."""
    # Get current date in YYYYMMDD format
    print(f"Starting data collection and processing")

    # 1. Fetch daily station data
    print("Fetching daily station data...")
    try:
        fetch_station_data("./data", "daily", "recent")
    except Exception as e:
        print(f"Error: Failed to fetch station data - {str(e)}")
        sys.exit(1)

    # 2. Extract and process the data
    print("Extracting and processing station data...")
    try:
        extract_daily_station_data(
            data_dir="./data/recent",
            from_date="20250101",
            output_dir="./data/extracted",
            invalid_value=-999,
        )
    except Exception as e:
        print(f"Error: Failed to extract station data - {str(e)}")
        sys.exit(1)

    # 3. Upload to S3
    print("Uploading processed data to S3...")

    bucket_name = os.environ.get("BUCKET_NAME")
    region = os.environ.get("REGION")
    endpoint_url = os.environ.get("ENDPOINT_URL")

    # For each csv file in the output directory
    for csv_file_path in Path("./data/extracted").glob("*.csv"):
        try:
            upload_file(
                csv_file_path,
                bucket_name,
                region,
                endpoint_url,
                directory="data/daily_recent_by_station",
            )
        except Exception as e:
            print(f"Error: Upload to S3 failed - {str(e)}")
            sys.exit(1)

    print("Upload to S3 completed successfully.")


if __name__ == "__main__":
    process_daily_weather_data()
    print("Job completed successfully!")
