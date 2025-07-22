import { getNow } from "../utils/dateUtils";

/**
 * Service to fetch daily weather station data from CSV file
 * @param {string} stationId - station ID of a station to fetch data for
 * @returns {Promise<{data: Object, dateRange: {from: string, to: string}}>} Historical data for station
 */
export const fetchDailyWeatherStationData = async (stationId) => {
    try {
        // Get today's date in YYYYMMDDHH format using Luxon
        const today = getNow();
        const cacheBuster = today.toFormat('yyyyLLddHH');

        const url = `/data/daily_recent_by_station/${stationId}.csv?t=${cacheBuster}`;

        const response = await fetch(url);

        // in case of a 404 error, error out
        if (!response.ok) {
            throw new Error(`Failed to fetch data from ${url}: ${response.status} ${response.statusText}.`);
        }

        const text = await response.text();

        const lines = text.split('\n').filter(line => line.trim());

        // Variables for storing date range
        let earliestDate = null;
        let latestDate = null;

        // Skip header line
        const dataLines = lines.slice(1);

        if (dataLines.length === 0) {
            throw new Error(`No data found for station ${stationId}.`);
        }

        // First line has earliest date (assuming file is chronologically ordered)
        earliestDate = dataLines[0].split(',')[0].trim();

        // Last line has latest date
        latestDate = dataLines[dataLines.length - 1].split(',')[0].trim();

        // Find the specific date we're looking for
        const data = dataLines.map(line => {
            const cols = line.split(',').map(col => col.trim());

            return {
                date: cols[0],
                meanTemperature: parseFloat(cols[1]) || undefined,
                minTemperature: parseFloat(cols[2]) || undefined,
                maxTemperature: parseFloat(cols[3]) || undefined,
                meanHumidity: parseFloat(cols[4]) || undefined
            };
        });

        if (!data || !data.length) {
            throw new Error(`No historical data found for station ${stationId}.`);
        }

        let result = {}
        for (let item of data) {
            result[item.date] = item;
        }

        return {
            data: result,
            dateRange: {
                from: earliestDate,
                to: latestDate
            }
        };
    } catch (error) {
        console.error(`Error loading daily weather stations data:`, error);
        throw error;
    }
};