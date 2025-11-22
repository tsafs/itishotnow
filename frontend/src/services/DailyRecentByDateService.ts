import DailyRecentByStation, { type IStationDataByStationId } from "../classes/DailyRecentByStation";
import { fetchAndParseCSV, parseOptionalFloat, replaceInvalidWithUndefined } from '../utils/csvUtils.js';
import { buildUrl } from '../utils/serviceUtils.js';

export interface DailyRecentByDateArgs {
    year: number;
    month: number;
    day: number;
}

/**
 * Service to fetch daily recent data of all stations by date.
 * This service fetches data for a specific date in the format YYYY-MM-DD.
 * It returns data keyed by station ID.
 * 
 * Example CSV data:
 * 
 * station_id,date,max_temperature,min_temperature,mean_temperature,mean_humidity
 * 44,2025-01-01,8.4,5.0,6.9,86.00
 * 73,2025-01-01,0.4,-6.3,-2.9,
 * 78,2025-01-01,8.2,4.8,6.7,83.00
 * 91,2025-01-01,5.5,-0.5,2.9,79.00
 * 96,2025-01-01,7.9,2.1,5.5,77.00
 * 125,2025-01-01,,,4.6,44.00
 * 131,2025-01-01,7.9,-1.9,4.1,67.00
 * 
 * 
 * @param {number} params.year - The year of the date.
 * @param {number} params.month - The month of the date (1-12).
 * @param {number} params.day - The day of the date (1-31).
 * @returns {Promise<IStationDataByStationId>} - A promise that resolves to the data keyed by station ID.
 * @throws {Error} - Throws an error if the fetch fails or if no data is found for the specified date.
 */
export const fetchDailyRecentByDateData = async (params: DailyRecentByDateArgs): Promise<IStationDataByStationId> => {
    const { year, month, day } = params;
    const paddedMonth = String(month).padStart(2, '0');
    const paddedDay = String(day).padStart(2, '0');
    const dateStr = `${year}-${paddedMonth}-${paddedDay}`;

    return fetchAndParseCSV<IStationDataByStationId>(
        buildUrl(`/data/daily_recent_by_date/${dateStr}.csv`, true, 'yyyyLLddHH'),
        (rows) => {
            const result: IStationDataByStationId = {};

            for (const [stationIdRaw, dateRaw, temperatureMaxRaw, temperatureMinRaw, temperatureMeanRaw, humidityMeanRaw] of rows) {
                if (!stationIdRaw || !dateRaw) continue;

                if (dateRaw !== dateStr) {
                    throw new Error(`Data for date ${dateStr} not found in the response.`);
                }

                const record = new DailyRecentByStation(
                    stationIdRaw,
                    dateRaw,
                    replaceInvalidWithUndefined(parseOptionalFloat(temperatureMeanRaw)),
                    replaceInvalidWithUndefined(parseOptionalFloat(temperatureMinRaw)),
                    replaceInvalidWithUndefined(parseOptionalFloat(temperatureMaxRaw)),
                    replaceInvalidWithUndefined(parseOptionalFloat(humidityMeanRaw))
                );

                result[record.stationId] = record.toJSON();
            }

            if (Object.keys(result).length === 0) {
                throw new Error(`No historical data found for date ${dateStr}.`);
            }

            return result;
        },
        {
            validateHeaders: ['station_id', 'date', 'max_temperature', 'min_temperature', 'mean_temperature', 'mean_humidity'],
            errorContext: `daily recent data for ${dateStr}`
        }
    );
};