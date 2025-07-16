/**
 * Service to fetch weather stations data from a remote CSV file, specifically for rolling averages.
 * @param {string} station_id - station ID of a station to filter data by
 * @returns {Promise<Array>} Array of station data objects
 */
export const fetchRollingAverageForStation = async (station_id) => {
    try {
        // Construct the URL for the rolling average data
        const url = `/data/rolling_average/1951_2024/daily/${station_id}_1951-2024_avg_7d.csv`;

        const response = await fetch(url);

        // in case of a 404 error, error out
        if (!response.ok) {
            throw new Error(`Failed to fetch rolling average data for ${station_id} from 1951 to 2024: ${response.status} ${response.statusText}. Are you in the wrong timezone? Our data is based on UTC.`);
        }

        const text = await response.text();

        const lines = text.split('\n');

        // Parse CSV data into array of station objects
        let data = lines.slice(1).map(line => {
            if (!line.trim()) return null; // Skip empty lines

            const cols = line.split(',').map(col => col.trim());

            // Extract date components
            const dateParts = cols[0].split('-');
            if (dateParts.length < 3) return null;

            return {
                date: cols[0],
                tas: parseFloat(cols[1]),
            };
        }).filter(Boolean); // Remove null entries

        if (data.length === 0) {
            throw new Error(`No data found for ${station_id} from 1951 to 2024.`);
        }

        return data;
    } catch (error) {
        console.error(`Error loading rolling average data for ${station_id} from 1951 to 2024:`, error);
        throw error;
    }
};