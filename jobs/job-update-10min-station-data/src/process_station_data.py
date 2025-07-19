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
            invalid_value=-999,
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

    try:
        download_file(
            bucket_name, "data/hyras_stations.csv", reference_file, region, endpoint_url
        )
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
            output_file=output_file,
        )
    except Exception as e:
        print(f"Error: Failed to filter station data - {str(e)}")
        sys.exit(1)

    print(f"Data processing complete. Output saved to {output_file}")

    # 6. Upload to S3
    print("Uploading processed data to S3...")

    try:
        upload_file(
            output_file, bucket_name, region, endpoint_url, directory="station_data"
        )
    except Exception as e:
        print(f"Error: Upload to S3 failed - {str(e)}")
        sys.exit(1)

    print("Upload to S3 completed successfully.")

    return output_file, reference_file


if __name__ == "__main__":
    process_live_weather_data()

    print("Job completed successfully!")
