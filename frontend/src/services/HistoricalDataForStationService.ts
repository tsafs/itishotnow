import { getNow } from "../utils/dateUtils.js";
import { DateRange } from "../classes/DateRange.js";
import { DailyRecentByStation } from "../classes/DailyRecentByStation.js";

/**
 * Service to fetch daily weather station data from CSV file
 * @param {string} stationId - station ID of a station to fetch data for
 * @returns {Promise<{data: {[date: string]: DailyRecentByStation}, dateRange: DateRange}>} Historical data for station
 */
export const fetchDailyWeatherStationData = async (stationId: string): Promise<{ data: { [date: string]: DailyRecentByStation }, dateRange: DateRange }> => {
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
        earliestDate = dataLines[0]?.split(',')[0]?.trim();

        // Last line has latest date
        latestDate = dataLines[dataLines.length - 1]?.split(',')[0]?.trim();

        if (!earliestDate || !latestDate) {
            throw new Error(`Invalid date range found for station ${stationId}: ${earliestDate} - ${latestDate}.`);
        }

        // Find the specific date we're looking for
        const data = dataLines
            .map(line => {
                const [date, temperature_mean, temperature_min, temperature_max, humidity_mean] = line.split(',').map(col => col.trim());
                if (![date, temperature_mean, temperature_min, temperature_max, humidity_mean].every(Boolean)) return null;
                return new DailyRecentByStation(
                    stationId,
                    date as string,
                    parseFloat(temperature_mean as string),
                    parseFloat(temperature_min as string),
                    parseFloat(temperature_max as string),
                    parseFloat(humidity_mean as string)
                );
            })
            .filter(Boolean);

        if (!data.length) {
            throw new Error(`No historical data found for station ${stationId}.`);
        }

        return {
            data: Object.fromEntries(data.map(item => [item?.date, item])),
            dateRange: new DateRange(earliestDate, latestDate)
        };
    } catch (error) {
        console.error(`Error loading daily weather stations data:`, error);
        throw error;
    }
};