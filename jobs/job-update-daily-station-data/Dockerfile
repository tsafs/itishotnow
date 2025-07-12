FROM python:3.13-slim

WORKDIR /app

# Copy project files
COPY jobs/job-update-daily-station-data/src ./src/
COPY analysis/stations/fetch_station_data.py ./src/
COPY analysis/stations/extract_daily_station_data.py ./src/
COPY analysis/utilities/upload_to_s3.py ./src/

# Copy the entrypoint script
COPY jobs/job-update-daily-station-data/entrypoint.sh /app/

# Install only dependencies that are actually imported in the scripts
RUN pip install --no-cache-dir requests bs4 boto3

# Create directories for data
RUN mkdir -p ./data

# Make the script executable
RUN chmod +x /app/entrypoint.sh

# Default command to run the entrypoint script
CMD ["/app/entrypoint.sh"]
