#!/usr/bin/env python3

import argparse
import csv
import re
import datetime
from pathlib import Path
import os

def parse_arguments():
    parser = argparse.ArgumentParser(
        description="Extract daily station data for a specific date into a single CSV file."
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
        default="./data/daily_station_data/extracted_group",
        help="Directory for the output CSV file",
    )
    parser.add_argument(
        "--date",
        type=str,
        required=True,
        help="Date to extract data for (YYYY-MM-DD)",
    )
    parser.add_argument(
        "--invalid-value",
        type=str,
        default="-999",
        help="Value indicating invalid data",
    )
    return parser.parse_args()

def read_station_descriptions(data_dir):
    input_file = Path(data_dir) / "KL_Tageswerte_Beschreibung_Stationen.txt"
    stations = []
    try:
        with open(input_file, encoding="latin1") as f:
            lines = f.readlines()
        data_lines = lines[2:]
        for line in data_lines:
            line = line.strip()
            if not line:
                continue
            try:
                station_id = line[0:6].strip().lstrip("0")
                station_name = line[61:102].strip()
                stations.append(
                    {
                        "station_id": station_id,
                        "station_name": station_name,
                    }
                )
            except Exception:
                continue
        return stations
    except Exception:
        return []

def find_recent_data_files(data_dir):
    data_dir_path = Path(data_dir)
    file_pattern = re.compile(r"produkt_klima_tag_\d+_\d+_(\d+)\.txt")
    station_files = {}
    for subdir in data_dir_path.glob("*"):
        if subdir.is_dir():
            for file_path in subdir.glob("*.txt"):
                match = file_pattern.match(file_path.name)
                if match:
                    station_id = match.group(1).lstrip("0")
                    station_files[station_id] = file_path
    return station_files

def process_station_data_for_date(file_path, target_date, invalid_value):
    # target_date: datetime.date
    check_columns = ["TMK", "TNK", "TXK", "UPM"]
    column_mapping = {
        "TMK": "mean_temperature",
        "TNK": "min_temperature",
        "TXK": "max_temperature",
        "UPM": "mean_humidity",
    }
    result = {}
    try:
        with open(file_path, "r", encoding="latin1") as f:
            header_line = f.readline().strip()
            columns = [col.strip() for col in header_line.split(";")]
            check_indices = {col: columns.index(col) for col in check_columns if col in columns}
            for line in f:
                if line.startswith("eor") or not line.strip():
                    continue
                parts = line.strip().split(";")
                if len(parts) < 2:
                    continue
                date_str = parts[1].strip()
                # Accept both YYYYMMDD and YYYYMMDDHHMM formats
                try:
                    line_date = datetime.datetime.strptime(date_str[:8], "%Y%m%d").date()
                except Exception:
                    continue
                if line_date != target_date:
                    continue
                for col, idx in check_indices.items():
                    if idx < len(parts) and parts[idx].strip() != invalid_value:
                        result[column_mapping[col]] = parts[idx].strip()
                break  # Only need one line for the date
        return result
    except Exception:
        return {}

def extract_daily_station_data_for_date(data_dir, target_date, output_dir, invalid_value="-999"):
    try:
        target_date = datetime.datetime.strptime(target_date, "%Y-%m-%d").date()
    except Exception:
        print("Invalid date format. Use YYYY-MM-DD.")
        return

    stations = read_station_descriptions(data_dir)
    station_files = find_recent_data_files(data_dir)
    os.makedirs(output_dir, exist_ok=True)
    output_file = Path(output_dir) / f"{target_date}.csv"

    fieldnames = [
        "station_id",
        "date",
        "max_temperature",
        "min_temperature",
        "mean_temperature",
        "mean_humidity",
    ]

    rows_written = 0
    with open(output_file, "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        for station in stations:
            station_id = station["station_id"]
            if station_id not in station_files:
                continue
            data = process_station_data_for_date(
                station_files[station_id], target_date, invalid_value
            )
            if not data:
                continue
            row = {
                "station_id": station_id,
                "date": target_date,
                "max_temperature": data.get("max_temperature", ""),
                "min_temperature": data.get("min_temperature", ""),
                "mean_temperature": data.get("mean_temperature", ""),
                "mean_humidity": data.get("mean_humidity", ""),
            }
            writer.writerow(row)
            rows_written += 1

    if rows_written == 0:
        print(f"No data found for date {target_date} in any station.")
        if output_file.exists():
            output_file.unlink()
        exit(1)

if __name__ == "__main__":
    args = parse_arguments()
    extract_daily_station_data_for_date(args.data_dir, args.date, args.output_dir, args.invalid_value)
