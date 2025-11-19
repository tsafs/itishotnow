import type { IStationData, IStationDataByStationId } from "../classes/DailyRecentByStation.js";
import { getNow } from "../utils/dateUtils.js";

export interface DailyRecentByDateArgs {
    year: number;
    month: number;
    day: number;
}

/**
 * Service to fetch daily recent data of all stations by date.
 * This service fetches data for a specific date in the format YYYY-MM-DD.
 * It returns data keyed by station ID.
 * @param {number} params.year - The year of the date.
 * @param {number} params.month - The month of the date (1-12).
 * @param {number} params.day - The day of the date (1-31).
 * @returns {Promise<IStationDataByStationId>} - A promise that resolves to the data keyed by station ID.
 * @throws {Error} - Throws an error if the fetch fails or if no data is found for the specified date.
 */
export const fetchDailyRecentByDateData = async (params: DailyRecentByDateArgs) => {
    const { year, month, day } = params;

    try {
        const paddedMonth = String(month).padStart(2, '0'); // Ensure month is two digits
        const paddedDay = String(day).padStart(2, '0'); // Ensure day is two

        // Get today's date in YYYYMMDDHH format using Luxon
        const today = getNow();
        const cacheBuster = today.toFormat('yyyyLLddHH');

        const url = `/data/daily_recent_by_date/${year}-${paddedMonth}-${paddedDay}.csv?t=${cacheBuster}`;

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
            throw new Error(`No data found for date ${year}-${paddedMonth}-${paddedDay}.`);
        }

        // Find the specific date we're looking for
        const data = dataLines.map(line => {
            const [stationId, date, temperatureMax, temperatureMin, temperatureMean, humidityMean] = line.split(',').map(col => col.trim());
            if (![stationId, date, temperatureMax, temperatureMin, temperatureMean, humidityMean].every(Boolean)) return null;

            if (date !== `${year}-${paddedMonth}-${paddedDay}`) {
                throw new Error(`Data for date ${year}-${paddedMonth}-${paddedDay} not found in the response.`);
            }

            return {
                stationId,
                date,
                temperatureMax: parseFloat(temperatureMax as string),
                temperatureMin: parseFloat(temperatureMin as string),
                temperatureMean: parseFloat(temperatureMean as string),
                humidityMean: parseFloat(humidityMean as string)
            } as IStationData;
        });

        if (!data || !data.length) {
            throw new Error(`No historical data found for date ${year}-${paddedMonth}-${paddedDay}.`);
        }

        let result: IStationDataByStationId = {}
        for (let item of data as Array<IStationData>) {
            result[item.stationId] = item;
        }

        return result;
    } catch (error) {
        console.error(`Error loading daily weather stations data:`, error);
        throw error;
    }
};