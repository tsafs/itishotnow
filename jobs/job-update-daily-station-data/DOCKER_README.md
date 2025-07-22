# Docker Setup

This Docker setup automates the process of fetching, processing, and storing daily station data.

## Overview

This Docker setup provides a streamlined way to:
1. Fetch daily climate station data from DWD (German Weather Service)
2. Process and extract relevant climate information
3. Upload the processed data to a Scaleway S3 bucket

## Building the Docker Image

Navigate to the root of the project and run:

```bash
docker build -t itishotow -f jobs/job-update-daily-station-data/Dockerfile .
```

## Running with Docker

### Complete Workflow (Fetch, Process, and Upload)

```bash
docker run \
  -e ACCESS_KEY=SCWFHFE30FTZCCHK0CN8 \
  -e SECRET_KEY=5b182159-554a-41db-a888-432a7c7ec189 \
  -e BUCKET_NAME=esistwarm.jetzt \
  -e REGION=fr-par \
  -e ENDPOINT_URL=https://s3.fr-par.scw.cloud \
  itishotnow
```

The container runs a single entrypoint script that:
1. Fetches raw station data using `fetch_station_data.py`
2. Processes it with `extract_daily_station_data.py`
3. Uploads the result to S3 using `upload_to_s3.py`

All steps are executed sequentially in a single run, with appropriate error handling at each stage.
