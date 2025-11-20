import { getNow } from "../utils/dateUtils";
import DateRange, { type IDateRange } from "../classes/DateRange";
import DailyRecentByStation, { type IStationDataByDate } from "../classes/DailyRecentByStation";

/**
 * Service to fetch daily weather station data from CSV file
 * @param {string} stationId - station ID of a station to fetch data for
 * @returns {Promise<{data: {[date: string]: DailyRecentByStation}, dateRange: DateRange}>} Historical data for station
 */
export interface DailyWeatherStationDataResponse {
    data: IStationDataByDate;
    dateRange: DateRange;
}

export const fetchDailyWeatherStationData = async (stationId: string): Promise<DailyWeatherStationDataResponse> => {
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

        // Skip header line
        const dataLines = lines.slice(1);

        if (dataLines.length === 0) {
            throw new Error(`No data found for station ${stationId}.`);
        }

        const earliestCandidate = dataLines[0]?.split(',')[0]?.trim();
        const latestCandidate = dataLines[dataLines.length - 1]?.split(',')[0]?.trim();

        const earliestDate = earliestCandidate && earliestCandidate.length > 0 ? earliestCandidate : null;
        const latestDate = latestCandidate && latestCandidate.length > 0 ? latestCandidate : null;

        if (!earliestDate || !latestDate) {
            throw new Error(`Invalid date range found for station ${stationId}: ${earliestDate} - ${latestDate}.`);
        }

        // Find the specific date we're looking for
        const data = dataLines
            .map(line => {
                const [dateRaw, temperatureMeanRaw, temperatureMinRaw, temperatureMaxRaw, humidityMeanRaw] = line.split(',').map(col => col.trim());
                if (!dateRaw) return null;

                const meanTemperature = temperatureMeanRaw ? parseFloat(temperatureMeanRaw) : undefined;
                const minTemperature = temperatureMinRaw ? parseFloat(temperatureMinRaw) : undefined;
                const maxTemperature = temperatureMaxRaw ? parseFloat(temperatureMaxRaw) : undefined;
                const meanHumidity = humidityMeanRaw ? parseFloat(humidityMeanRaw) : undefined;

                return new DailyRecentByStation(
                    stationId,
                    dateRaw,
                    Number.isNaN(meanTemperature) ? undefined : meanTemperature,
                    Number.isNaN(minTemperature) ? undefined : minTemperature,
                    Number.isNaN(maxTemperature) ? undefined : maxTemperature,
                    Number.isNaN(meanHumidity) ? undefined : meanHumidity
                );
            })
            .filter((item): item is DailyRecentByStation => Boolean(item));

        if (!data.length) {
            throw new Error(`No historical data found for station ${stationId}.`);
        }

        const result: IStationDataByDate = Object.fromEntries(
            data.map(item => [item.date, item.toJSON()])
        );

        return {
            data: result,
            dateRange: new DateRange(earliestDate, latestDate)
        };
    } catch (error) {
        console.error(`Error loading daily weather stations data:`, error);
        throw error;
    }
};