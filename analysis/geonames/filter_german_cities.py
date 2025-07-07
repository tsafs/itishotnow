import csv
import argparse

def is_valid_lat_lon(lat, lon):
    try:
        lat = float(lat)
        lon = float(lon)
    except ValueError:
        return False
    return -90 <= lat <= 90 and -180 <= lon <= 180

def is_possible_swapped_german_coords(lat, lon):
    try:
        lat = float(lat)
        lon = float(lon)
    except ValueError:
        return False
    # Typical Germany: lat 47-55, lon 5-16
    return (5 <= lat <= 16) and (47 <= lon <= 55)

def main():
    parser = argparse.ArgumentParser(description="Filter German cities by population.")
    parser.add_argument("--input-file", help="Input tab-delimited file")
    parser.add_argument("--output-file", help="Output CSV file")
    parser.add_argument("--min-population", type=int, help="Minimum population")
    args = parser.parse_args()

    with open(args.input_file, encoding="utf-8") as infile, \
         open(args.output_file, "w", newline='', encoding="utf-8") as outfile:
        reader = csv.reader(infile, delimiter='\t')
        writer = csv.writer(outfile)
        writer.writerow(["city_name", "lat", "lon"])

        for row in reader:
            # Skip empty or malformed rows
            if len(row) < 19:
                continue
            country_code = row[8]
            try:
                population = int(row[14])
            except ValueError:
                continue
            if country_code == "DE" and population > args.min_population:
                city_name = row[1]
                lat = row[4]
                lon = row[5]
                if not is_valid_lat_lon(lat, lon):
                    print(f"Warning: Invalid lat/lon for city '{city_name}': lat={lat}, lon={lon}")
                elif is_possible_swapped_german_coords(lat, lon):
                    print(f"Warning: Possible swapped lat/lon for city '{city_name}': lat={lat}, lon={lon}")
                writer.writerow([city_name, lat, lon])

if __name__ == "__main__":
    main()
