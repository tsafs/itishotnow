#!/usr/bin/env python3

import argparse
import csv
import re
import datetime
from pathlib import Path
import os


def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Extract 10-minute station data into a csv file and calculate statistics."
    )
    parser.add_argument(
        "--data-dir",
        type=str,
        default="./data/daily_station_data/recent",
        help="Directory containing the daily station data files",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="./data/daily_station_data/extracted",
        help="Path for the output CSV files per station",
    )
    parser.add_argument(
        "--from-date",
        type=str,
        default=datetime.date.today().strftime("%Y%m%d"),
        help="From which day to start extracting data (YYYYMMDD)",
    )
    parser.add_argument(
        "--invalid-value",
        type=str,
        default="-999",
        help="Value indicating invalid data",
    )
    return parser.parse_args()


def read_station_descriptions(data_dir):
    """Read and parse station descriptions from the input file within data directory."""
    input_file = Path(data_dir) / "KL_Tageswerte_Beschreibung_Stationen.txt"
    print(f"Reading station descriptions from {input_file}")

    try:
        with open(input_file, encoding="latin1") as f:
            lines = f.readlines()

        # Skip header lines (first 2)
        data_lines = lines[2:]

        stations = []
        for line in data_lines:
            line = line.strip()
            if not line:
                continue

            # Fixed width format extraction
            # Extract fields based on fixed positions in the line
            try:
                station_id = line[0:6].strip().lstrip("0")
                hoehe = line[34:38].strip()
                geoBreite = line[38:50].strip()
                geoLaenge = line[50:61].strip()
                station_name = line[61:102].strip()

                stations.append(
                    {
                        "station_id": station_id,
                        "station_name": station_name,
                        "hoehe": hoehe,
                        "geoBreite": geoBreite,
                        "geoLaenge": geoLaenge,
                    }
                )
            except Exception as e:
                print(f"Error parsing line: {line}")
                print(f"Error details: {e}")

        print(f"Found {len(stations)} stations in description file")
        return stations

    except Exception as e:
        print(f"Error reading station descriptions: {e}")
        return []


def find_recent_data_files(data_dir):
    """Find all recent daily data files for stations."""
    print(f"Looking for recent daily data files in {data_dir}")
    data_dir_path = Path(data_dir)

    if not data_dir_path.exists():
        print(f"Data directory {data_dir} does not exist")
        return {}

    # Pattern for 10-minute data: produkt_zehn_now_tu_YYYYMMDD_YYYYMMDD_XXXXX.txt or
    # produkt_zehn_akt_tu_YYYYMMDD_YYYYMMDD_XXXXX.txt
    file_pattern = re.compile(r"produkt_klima_tag_\d+_\d+_(\d+)\.txt")

    station_files = {}

    for subdir in data_dir_path.glob("*"):
        if subdir.is_dir():
            for file_path in subdir.glob("*.txt"):
                match = file_pattern.match(file_path.name)
                if match:
                    station_id = match.group(1)
                    # Store with leading zeros stripped to match station IDs in description
                    station_id_clean = station_id.lstrip("0")
                    station_files[station_id_clean] = file_path

    print(f"Found recent data files for {len(station_files)} stations")
    return station_files


def process_station_data(file_path, from_date, invalid_value):
    """Process daily station data to extract statistics."""
    try:

        check_columns = ["TMK", "TNK", "TXK", "UPM"]
        output_columns = [
            "temperature_mean",
            "temperature_min",
            "temperature_max",
            "humidity_mean",
        ]
        column_mapping = dict(zip(check_columns, output_columns))

        # Dictionary to store latest valid data and statistics
        data: dict[str, list] = {}

        with open(file_path, "r", encoding="latin1") as f:  # Using latin1 for DWD files
            # Read header to get column positions
            header_line = f.readline().strip()
            columns = [col.strip() for col in header_line.split(";")]

            # Find positions of columns to check
            check_indices = {}
            for col in check_columns:
                if col in columns:
                    check_indices[col] = columns.index(col)
                else:
                    print(
                        f"Warning: Column {col} not found in data file {file_path.name}"
                    )

            if not check_indices:
                print(f"No valid columns to check in {file_path.name}")
                return False, {}

            # Read data from the file
            for line in f:
                if line.startswith("eor") or not line.strip():
                    continue

                parts = line.strip().split(";")
                if len(parts) < 2:
                    continue

                date_str = parts[1].strip()

                # Handle 10min data format (YYYYMMDDHHMM)
                # Extract just the date part for comparison
                if len(date_str) >= 8:
                    date_for_comparison = datetime.datetime.strptime(
                        date_str[:8], "%Y%m%d"
                    )
                    from_date_for_comparison = datetime.datetime.strptime(
                        from_date, "%Y%m%d"
                    )

                    if date_for_comparison < from_date_for_comparison:
                        continue

                    # Process latest data for each column
                    for col, idx in check_indices.items():
                        if idx < len(parts) and parts[idx].strip() != invalid_value:
                            output_col = column_mapping[col]

                            if output_col not in data:
                                data[output_col] = []

                            data[output_col].append(
                                {
                                    "date": date_str,
                                    "value": parts[idx].strip(),
                                }
                            )

        has_valid_data = bool(data)
        return has_valid_data, data

    except Exception as e:
        print(f"Error processing station data in {file_path}: {e}")
        return False, {}


def write_station_to_csv(station, output_dir):
    """Write a single station's data to CSV file."""
    output_file = Path(output_dir) / f"{station['station_id']}.csv"

    try:
        with open(output_file, "w", newline="", encoding="utf-8") as csvfile:
            fieldnames = [
                "date",
                "temperature_mean",
                "temperature_min",
                "temperature_max",
                "humidity_mean",
            ]
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()

            data_by_date = {}
            for metric in station["data"]:
                for entry in station["data"][metric]:
                    date = entry["date"]
                    value = entry["value"]

                    if date not in data_by_date:
                        data_by_date[date] = {field: "" for field in fieldnames}
                        data_by_date[date]["date"] = date

                    data_by_date[date][metric] = value

            for date, row in data_by_date.items():
                writer.writerow(row)

        return True
    except Exception as e:
        print(f"Error writing station {station['station_id']} to CSV: {e}")
        return False


def extract_daily_station_data(data_dir, from_date, invalid_value, output_dir):
    """Main function to extract and process daily station data."""

    # Read station descriptions from the data directory
    stations = read_station_descriptions(data_dir)

    # Get recent data files and latest pull date
    station_files = find_recent_data_files(data_dir)

    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)

    # Process stations one by one
    print(f"Processing stations with data on reference date: {from_date}")

    successful_stations = 0
    total_stations = len(stations)

    for i, station in enumerate(stations, 1):
        station_id = station["station_id"].lstrip(
            "0"
        )  # Ensure leading zeros are stripped for matching

        print(
            f"Processing station {i}/{total_stations}: {station_id} - {station['station_name']}..."
        )

        if station_id not in station_files:
            print(f"  Station {station_id} has no daily data file, skipping")
            continue

        has_valid_data, data = process_station_data(
            station_files[station_id], from_date, invalid_value
        )

        if not has_valid_data:
            print(
                f"  Station {station_id} has no valid data for the specified time range, skipping"
            )
            continue

        # Add data to the station record
        station["data"] = data

        # Write this station to CSV immediately
        if write_station_to_csv(station, output_dir):
            successful_stations += 1
            print(f"  Station {station_id} processed and saved successfully")

        # Clear data after writing to save memory
        station.pop("data", None)

    print(
        f"Processing complete! Successfully processed {successful_stations} out of {total_stations} stations"
    )


def main():
    args = parse_arguments()
    extract_daily_station_data(
        args.data_dir, args.from_date, args.invalid_value, args.output_dir
    )


if __name__ == "__main__":
    main()
