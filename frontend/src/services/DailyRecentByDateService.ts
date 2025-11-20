import DailyRecentByStation, { type IStationDataByStationId } from "../classes/DailyRecentByStation";
import { getNow } from "../utils/dateUtils";

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
export const fetchDailyRecentByDateData = async (params: DailyRecentByDateArgs): Promise<IStationDataByStationId> => {
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
            const [stationIdRaw, dateRaw, temperatureMaxRaw, temperatureMinRaw, temperatureMeanRaw, humidityMeanRaw] = line.split(',').map(col => col.trim());

            if (!stationIdRaw || !dateRaw) {
                return null;
            }

            if (dateRaw !== `${year}-${paddedMonth}-${paddedDay}`) {
                throw new Error(`Data for date ${year}-${paddedMonth}-${paddedDay} not found in the response.`);
            }

            const meanTemperature = temperatureMeanRaw ? parseFloat(temperatureMeanRaw) : undefined;
            const minTemperature = temperatureMinRaw ? parseFloat(temperatureMinRaw) : undefined;
            const maxTemperature = temperatureMaxRaw ? parseFloat(temperatureMaxRaw) : undefined;
            const meanHumidity = humidityMeanRaw ? parseFloat(humidityMeanRaw) : undefined;

            return new DailyRecentByStation(
                stationIdRaw,
                dateRaw,
                Number.isNaN(meanTemperature) ? undefined : meanTemperature,
                Number.isNaN(minTemperature) ? undefined : minTemperature,
                Number.isNaN(maxTemperature) ? undefined : maxTemperature,
                Number.isNaN(meanHumidity) ? undefined : meanHumidity
            );
        });

        if (!data || !data.length) {
            throw new Error(`No historical data found for date ${year}-${paddedMonth}-${paddedDay}.`);
        }

        const result: IStationDataByStationId = {};
        for (const item of data.filter((entry): entry is DailyRecentByStation => entry !== null)) {
            result[item.stationId] = item.toJSON();
        }

        return result;
    } catch (error) {
        console.error(`Error loading daily weather stations data:`, error);
        throw error;
    }
};