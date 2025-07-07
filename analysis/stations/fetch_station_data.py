import os
import requests
import zipfile
import argparse
from io import BytesIO
from bs4 import BeautifulSoup

# Base URL for the DWD data
DAILY_BASE_URL = "https://opendata.dwd.de/climate_environment/CDC/observations_germany/climate/daily/kl/"
HOURLY_BASE_URL = "https://opendata.dwd.de/climate_environment/CDC/observations_germany/climate/hourly/air_temperature/"
TEN_MIN_BASE_URL = "https://opendata.dwd.de/climate_environment/CDC/observations_germany/climate/10_minutes/air_temperature/"

def parse_arguments():
    parser = argparse.ArgumentParser(description="Download DWD climate data")
    parser.add_argument("--granularity", choices=["daily", "hourly", "10min"], default="hourly", 
                        help="Granularity of data to download: 'daily', 'hourly', or '10min'")
    parser.add_argument("--type", choices=["recent", "historical", "now"], default="recent", 
                        help="Type of data to download: 'recent', 'historical', or 'now' (10min only)")
    parser.add_argument("--output-dir", type=str, default="./data",
                        help="Directory to store downloaded data (default: ./data)")
    return parser.parse_args()

def download_and_extract_zip(url, output_dir):
    """Download and extract a zip file from the given URL."""
    # Skip if already extracted
    zip_name = url.split("/")[-1].replace(".zip", "")
    zip_output_dir = os.path.join(output_dir, zip_name)
    if os.path.exists(zip_output_dir) and os.listdir(zip_output_dir):
        print(f"Files already extracted: {zip_output_dir}")
        return
        
    response = requests.get(url)
    if response.status_code == 200:
        os.makedirs(zip_output_dir, exist_ok=True)
        with zipfile.ZipFile(BytesIO(response.content)) as z:
            z.extractall(zip_output_dir)
            print(f"Extracted: {url} into {zip_output_dir}")
    else:
        print(f"Failed to download: {url}")

def fetch_metadata(url, output_dir):
    """Download the metadata file."""
    filename = url.split("/")[-1]
    metadata_path = os.path.join(output_dir, filename)
    
    # Skip if file already exists
    if os.path.exists(metadata_path):
        print(f"Metadata already exists: {metadata_path}")
        return
        
    response = requests.get(url)
    if response.status_code == 200:
        with open(metadata_path, "wb") as f:
            f.write(response.content)
        print(f"Metadata downloaded: {metadata_path}")
    else:
        print(f"Failed to download metadata: {url}")

def fetch_climate_data(data_granularity="hourly", data_type="recent", output_dir="./data"):
    """Fetch climate data files of the specified type."""
    if data_granularity not in ["daily", "hourly", "10min"]:
        print(f"Invalid granularity: {data_granularity}. Must be 'daily', 'hourly', or '10min'")
        return

    if data_type not in ["recent", "historical", "now"]:
        print(f"Invalid data type: {data_type}. Must be 'recent', 'historical', or 'now'")
        return
    
    if data_granularity == "daily":
        current_base_url = f"{DAILY_BASE_URL}{data_type}/"
        metadata_url = f"{current_base_url}KL_Tageswerte_Beschreibung_Stationen.txt"
    elif data_granularity == "hourly":
        current_base_url = f"{HOURLY_BASE_URL}{data_type}/"
        metadata_url = f"{current_base_url}TU_Stundenwerte_Beschreibung_Stationen.txt"
    else:  # 10min
        current_base_url = f"{TEN_MIN_BASE_URL}{data_type}/"
        if data_type == "now":
            metadata_url = f"{current_base_url}zehn_now_tu_Beschreibung_Stationen.txt"
        else:
            metadata_url = f"{current_base_url}zehn_min_tu_Beschreibung_Stationen.txt"
    
    # Create data type specific directory
    data_dir = os.path.join(output_dir, f"{data_type}")
    os.makedirs(data_dir, exist_ok=True)
    
    # Fetch metadata file
    fetch_metadata(metadata_url, data_dir)

    # Fetch all zip files
    print(f"Fetching {data_type} climate data from {current_base_url}")
    response = requests.get(current_base_url)
    if response.status_code == 200:
        soup = BeautifulSoup(response.text, "html.parser")
        for link in soup.find_all("a"):
            href = link.get("href")
            if href and href.endswith(".zip"):
                zip_url = f"{current_base_url}{href}"
                download_and_extract_zip(zip_url, data_dir)
    else:
        print(f"Failed to fetch the list of zip files: {current_base_url}")

def fetch_station_data(output_dir, granularity, type):
    # Ensure the output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    # Download files based on specified type
    fetch_climate_data(granularity, type, output_dir)

def main():  
    args = parse_arguments()
    fetch_station_data(args.output_dir, args.granularity, args.type)  

if __name__ == "__main__":
    main()