#!/usr/bin/env python3

import os
import sys
from pathlib import Path
import boto3
import datetime

# Direct imports of functions from other scripts
from fetch_station_data import fetch_station_data
from extract_daily_station_data import extract_daily_station_data
from extract_daily_station_data_for_date import extract_daily_station_data_for_date
from upload_to_s3 import upload_file


def s3_list_objects(bucket, prefix, region, endpoint_url):
    """Return a set of object names under the given prefix in S3 bucket."""
    s3_client = boto3.client(
        's3',
        region_name=region,
        endpoint_url=endpoint_url,
        aws_access_key_id=os.environ['ACCESS_KEY'],
        aws_secret_access_key=os.environ['SECRET_KEY']
    )
    paginator = s3_client.get_paginator('list_objects_v2')
    object_names = set()
    for page in paginator.paginate(Bucket=bucket, Prefix=prefix):
        for obj in page.get('Contents', []):
            object_names.add(obj['Key'])
    return object_names


def process_grouped_daily_station_data():
    """Check for grouped daily station data files in S3, create and upload if missing."""
    extracted_dir = Path("./data/extracted")
    output_dir = "./data/extracted_group"
    bucket_name = os.environ.get("BUCKET_NAME")
    region = os.environ.get("REGION")
    endpoint_url = os.environ.get("ENDPOINT_URL")
    directory = "data/daily_recent_by_date"
    prefix = f"{directory}/"

    # Collect all unique dates from all station files in ./data/extracted
    dates = set()
    for csv_file in extracted_dir.glob("*.csv"):
        with open(csv_file, "r", encoding="utf-8") as f:
            next(f)  # skip header
            for line in f:
                parts = line.strip().split(",")
                if not parts or not parts[0]:
                    continue
                date_str = parts[0].strip()
                # Accept YYYYMMDD format only
                if len(date_str) == 8 and date_str.isdigit():
                    try:
                        date_obj = datetime.datetime.strptime(date_str, "%Y%m%d").date()
                        dates.add(date_obj)
                    except Exception:
                        continue

    # List all objects in the S3 directory once
    existing_objects = s3_list_objects(bucket_name, prefix, region, endpoint_url)

    for date_obj in sorted(dates):
        date_str = date_obj.strftime("%Y-%m-%d")
        s3_filename = f"{date_str}.csv"
        s3_object_name = f"{directory}/{s3_filename}"
        if s3_object_name in existing_objects:
            print(f"S3 file exists for {date_str}: {s3_object_name}")
            continue

        print(f"Creating grouped daily station data for {date_str}")
        extract_daily_station_data_for_date("./data/recent", date_str, str(output_dir), "-999")

        local_file = f"{output_dir}/{s3_filename}"
        upload_file(
            local_file,
            bucket_name,
            region,
            endpoint_url,
            directory=directory
        )


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
    directory = "data/daily_recent_by_station"

    # For each csv file in the output directory, always upload and overwrite
    for csv_file_path in Path("./data/extracted").glob("*.csv"):
        s3_object_name = f"{directory}/{csv_file_path.name}"
        try:
            upload_file(
                csv_file_path,
                bucket_name,
                region,
                endpoint_url,
                directory=directory,
            )
            print(f"Uploaded and overwrote {csv_file_path.name} to S3: {s3_object_name}")
        except Exception as e:
            print(f"Error: Upload to S3 failed - {str(e)}")
            sys.exit(1)

    print("Upload to S3 completed successfully.")

    # New step: process grouped daily station data
    print("Processing grouped daily station data by date...")
    process_grouped_daily_station_data()
    print("Grouped daily station data processing completed.")


if __name__ == "__main__":
    process_daily_weather_data()
    print("Job completed successfully!")
