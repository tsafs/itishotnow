import Station from "../classes/Station";
import StationData from "../classes/StationData";
import { getNow } from "../utils/dateUtils";

const replaceWithUndefined = (value) => {
    if (value === -999) {
        return undefined;
    } else {
        return value;
    }
}

/**
 * Service to fetch weather stations data from CSV file
 * @returns {Promise<Array>} Array of station data objects
 */
export const fetchLiveData = async () => {
    try {
        // Get today's date in YYYYMMDD format
        const today = getNow();
        const yearMonthDay = today.toFormat('yyyyLLdd');
        const cacheBuster = today.toFormat('yyyyLLddHH');

        const url = `/station_data/10min_station_data_${yearMonthDay}.csv?t=${cacheBuster}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch live data: ${response.status} ${response.statusText}`);
        }

        const text = await response.text();

        const lines = text.split('\n');

        // Parse CSV data into array of station objects
        const data = lines.slice(1).map(line => {
            if (!line.trim()) return null; // Skip empty lines

            // Custom parsing to handle commas within quoted fields
            const cols = [];
            let currentValue = '';
            let inQuotes = false;

            for (let i = 0; i < line.length; i++) {
                const char = line[i];

                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    cols.push(currentValue);
                    currentValue = '';
                } else {
                    currentValue += char;
                }
            }
            cols.push(currentValue); // Add the last column

            // Remove trailing commas and clean station name
            const stationName = cols[1].replace(/,\s*$/, '').replace(/^"|"$/g, '');

            return {
                station: new Station(
                    cols[0],
                    stationName,
                    parseFloat(cols[3]),
                    parseFloat(cols[4]),
                    parseFloat(cols[5])
                ),
                data: new StationData(
                    cols[0],
                    cols[2],
                    replaceWithUndefined(parseFloat(cols[9])),
                    replaceWithUndefined(parseFloat(cols[8])),
                    replaceWithUndefined(parseFloat(cols[7])),
                    replaceWithUndefined(parseFloat(cols[6]))
                )
            };
        }).filter(Boolean); // Remove null entries

        // Convert data to dictionary
        let stations = {};
        for (let item of data) {
            stations[item.station.id] = item.station;
        }

        let stationData = {};
        for (let item of data) {
            stationData[item.data.stationId] = item.data;
        }

        return { stations, stationData };
    } catch (error) {
        console.error(`Error fetching live data: ${error.message}`);
        throw error;
    }
};