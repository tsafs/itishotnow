## Task: Aggregate Daily Temperature Data from DWD Files

### Objective
Develop a Python script to process extracted DWD daily climate NetCDF files, aggregate daily maximum and minimum temperature values, calculate their means, and store the results in a database linked to each station ID.

---

### Input Data

- **Location:** `data/` folder
- **File Pattern:** `tageswerte_KL_<station_id>_<startdate>_<enddate>_hist/produkt_klima_tag_<startdate>_<enddate>_<station_id>.txt`
- **Format:** Semicolon-separated text files with columns including `STATIONS_ID`, `TXK` (daily max), and `TNK` (daily min).

---

### Processing Steps

1. **File Selection**
   - Accept a user-specified list of extracted files to process.
   - Accept a start and end date. Only data from within these dates is taken.

2. **Parsing**
   - For each file:
     - Read the file and extract columns: `STATIONS_ID`, `TXK`, `TNK`.
     - Ignore rows where `TXK` or `TNK` is `-999` (missing data).

3. **Aggregation**
   - For each station:
     - Calculate the mean daily temperature taking `TXK` (daily max) and `TNK`(daily min) into account.
     - Calculate the mean of daily max, min, and mean accross a configurable time span around the corresponding day. I.e. the specified `span=7` would calculate the mean of each metric across 7 days before today and 7 days after today, totalling to a mean of 15 days (7 before, today, 7 after). `span` defaults to `0`, which means that no days prior or past are taken into account.

4. **Database Storage**
   - Store the results in a database table with columns:
     - `station_id` - id of the station
     - `date` - corresponding day
     - `span` - number of days around current day
     - `mean` - mean of average daily temperature
     - `max` - mean of max daily temperature
     - `min` - mean of min daily temperature

---

### Requirements

- Use efficient data processing libraries (e.g., pandas).
- Use an ORM (e.g., SQLAlchemy), PostgreSQL + PostGIS
- Handle missing or invalid data gracefully.
- Add logging for processed files, errors, and summary of missing and invalid data per source.
- Provide a summary report after processing.

---

### Notes

- Station metadata (including GPS coordinates) is stored in a separate table and should be linked via `station_id`.