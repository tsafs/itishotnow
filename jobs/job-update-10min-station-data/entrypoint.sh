#!/bin/bash

# Check if AWS credentials are set
if [ -z "$ACCESS_KEY" ] || [ -z "$SECRET_KEY" ] || [ -z "$BUCKET_NAME" ] || [ -z "$REGION" ] || [ -z "$ENDPOINT_URL" ]; then
    echo "Error: AWS credentials or bucket name not set. Please provide ACCESS_KEY, SECRET_KEY, BUCKET_NAME, REGION, and ENDPOINT_URL as environment variables."
    exit 1
fi

python src/process_station_data.py
