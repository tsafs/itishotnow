FROM python:3.13-slim

WORKDIR /app

# Copy project files
COPY jobs/job-update-10min-station-data/src ./src/
COPY analysis/stations/fetch_station_data.py ./src/
COPY analysis/stations/extract_10min_station_data.py ./src/
COPY analysis/stations/filter_10min_station_data_by_hyras.py ./src/
COPY analysis/utilities/upload_to_s3.py ./src/
COPY analysis/utilities/download_from_s3.py ./src/

# Copy the entrypoint script
COPY jobs/job-update-10min-station-data/entrypoint.sh /app/

# Install only dependencies that are actually imported in the scripts
RUN pip install --no-cache-dir requests bs4 boto3 pandas

# Create directories for data
RUN mkdir -p ./data

# Make the script executable
RUN chmod +x /app/entrypoint.sh

# Default command to run the entrypoint script
CMD ["/app/entrypoint.sh"]
