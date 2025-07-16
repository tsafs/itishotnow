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
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const day = String(today.getDate()).padStart(2, '0');
        const hour = String(today.getHours()).padStart(2, '0'); // Get current hour (00-23)
        let year_month_day = `${year}${month}${day}`;

        const url = `/station_data/10min_station_data_${year_month_day}.csv?t=${year}${month}${day}${hour}`;

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
                station_id: cols[0],
                station_name: stationName,
                data_date: cols[2],
                elevation: parseFloat(cols[3]),
                station_lat: parseFloat(cols[4]),
                station_lon: parseFloat(cols[5]),
                temperature: replaceWithUndefined(parseFloat(cols[9])),
                min_temperature: replaceWithUndefined(parseFloat(cols[8])),
                max_temperature: replaceWithUndefined(parseFloat(cols[7])),
                humidity: replaceWithUndefined(parseFloat(cols[6])),
                subtitle: `${cols[2] ? cols[2] + ' Uhr' : 'k. A.'}`
            };
        }).filter(Boolean); // Remove null entries

        // Convert data to dictionary
        let result = {};
        for (let item of data) {
            result[item.station_id] = item;
        }

        return result;
    } catch (error) {
        console.error(`Error fetching live data: ${error.message}`);
        throw error;
    }
};