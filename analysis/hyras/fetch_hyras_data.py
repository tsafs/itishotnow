import os
import requests
import argparse
from bs4 import BeautifulSoup

# Base URL for the DWD NetCDF data
BASE_URL = "https://opendata.dwd.de/climate_environment/CDC/grids_germany/daily/hyras_de/"

def download_netcdf_file(url, output_dir):
    """Download a NetCDF file from the given URL."""

    # Ensure the output directory exists
    os.makedirs(output_dir, exist_ok=True)

    filename = url.split("/")[-1]
    output_path = os.path.join(output_dir, filename)
    
    # Skip if file already exists
    if os.path.exists(output_path):
        print(f"File already exists: {output_path}")
        return
    
    response = requests.get(url)
    if response.status_code == 200:
        with open(output_path, "wb") as f:
            f.write(response.content)
        print(f"Downloaded: {url} to {output_path}")
    else:
        print(f"Failed to download: {url}")

def fetch_netcdf_files(dataset, start_year, end_year, resolution, version, output_dir):
    """Fetch NetCDF files for the specified year range and resolution."""        
    print(f"Fetching '{dataset}' NetCDF files from year {start_year} to {end_year} with resolution '{resolution}' for version '{version}'.")
    
    base_url = f"{BASE_URL}/{dataset}/"

    # Fetch the directory listing
    response = requests.get(base_url)
    if response.status_code == 200:
        soup = BeautifulSoup(response.text, "html.parser")
        
        for link in soup.find_all("a"):
            href = link.get("href")
            if href and href.endswith(".nc"):
                # Extract the year from the filename (format: tasmax_hyras_1_1970_v6-0_de.nc)
                try:
                    file_parts = href.split("_")
                    if len(file_parts) >= 4:
                        file_year = int(file_parts[3])
                        file_resolution = file_parts[2]
                        file_version = file_parts[4]
                        
                        # Check if the file is within the requested year range and matches resolution (if specified)
                        if start_year <= file_year <= end_year and (resolution is None or file_resolution == resolution) and (version is None or file_version == version):
                            file_url = f"{base_url}{href}"
                            download_netcdf_file(file_url, output_dir)
                except (ValueError, IndexError) as e:
                    print(f"Error parsing filename {href}: {e}")
    else:
        print(f"Failed to fetch the list of files: {base_url}")

def main():
    # Set up command line arguments
    parser = argparse.ArgumentParser(description="Download NetCDF files from DWD")
    parser.add_argument("--dataset", required=True, type=str, help="Dataset to download (air_temperature_max, air_temperature_min, air_temperature_mean, humidity, precipitation, radiation_global)")
    parser.add_argument("--start-year", required=True, type=int, help="Start year for data download")
    parser.add_argument("--end-year", required=True, type=int, help="End year for data download")
    parser.add_argument("--resolution", required=True, type=str, help="Resolution of the data (e.g., '1' for 1km resolution)")
    parser.add_argument("--version", required=True, type=str, help="Version of the data (e.g., 'v6-1')")
    parser.add_argument('--output-dir', required=True, type=str, help='Output directory for hyras NetCDF files')
    
    args = parser.parse_args()
    
    # Download files based on specified year range and resolution
    fetch_netcdf_files(args.dataset, args.start_year, args.end_year, args.resolution, args.version, args.output_dir)

if __name__ == "__main__":
    main()
