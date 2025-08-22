import { getNow } from "../utils/dateUtils.js";

/**
 * Service to fetch daily weather station data from CSV file
 * @param {string} stationId - station ID of a station to fetch data for
 * @returns {Promise<{data: Object, dateRange: {from: string, to: string}}>} Historical data for station
 */
export const fetchDailyRecentByDateData = async ({ year, month, day }) => {
    try {
        month = String(month).padStart(2, '0'); // Ensure month is two digits
        day = String(day).padStart(2, '0'); // Ensure day is two

        // Get today's date in YYYYMMDDHH format using Luxon
        const today = getNow();
        const cacheBuster = today.toFormat('yyyyLLddHH');

        const url = `/data/daily_recent_by_date/${year}-${month}-${day}.csv?t=${cacheBuster}`;

        const response = await fetch(url);

        // in case of a 404 error, error out
        if (!response.ok) {
            throw new Error(`Failed to fetch data from ${url}: ${response.status} ${response.statusText}.`);
        }

        const text = await response.text();

        const lines = text.split('\n').filter(line => line.trim());

        // Skip header line
        const dataLines = lines.slice(1);

        if (dataLines.length === 0) {
            throw new Error(`No data found for date ${year}-${month}-${day}.`);
        }

        // Find the specific date we're looking for
        const data = dataLines.map(line => {
            const cols = line.split(',').map(col => col.trim());

            if (cols[1] !== `${year}-${month}-${day}`) {
                throw new Error(`Data for date ${year}-${month}-${day} not found in the response.`);
            }

            return {
                stationId: cols[0],
                date: cols[1],
                maxTemperature: parseFloat(cols[2]) || undefined,
                minTemperature: parseFloat(cols[3]) || undefined,
                meanTemperature: parseFloat(cols[4]) || undefined,
                meanHumidity: parseFloat(cols[5]) || undefined
            };
        });

        if (!data || !data.length) {
            throw new Error(`No historical data found for date ${year}-${month}-${day}.`);
        }

        let result = {}
        for (let item of data) {
            result[item.stationId] = item;
        }

        return result;
    } catch (error) {
        console.error(`Error loading daily weather stations data:`, error);
        throw error;
    }
};