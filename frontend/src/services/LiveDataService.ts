import Station from "../classes/Station";
import StationData from "../classes/StationData";
import { getNow } from "../utils/dateUtils";

const replaceWithUndefined = (value: number | undefined): number | undefined => {
    if (value === undefined || Number.isNaN(value) || value === -999) {
        return undefined;
    }
    return value;
};

export interface LiveStationRecord {
    station: Station;
    data: StationData;
}

export interface LiveDataResponse {
    stations: Record<string, Station>;
    stationData: Record<string, StationData>;
}

/**
 * Service to fetch weather stations data from CSV file
 * @returns {Promise<Array>} Array of station data objects
 */
export const fetchLiveData = async (): Promise<LiveDataResponse> => {
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
        const parsed = lines.slice(1).map(line => {
            if (!line.trim()) return null; // Skip empty lines

            // Custom parsing to handle commas within quoted fields
            const cols: string[] = [];
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
            const stationName = (cols[1] ?? '').replace(/,\s*$/, '').replace(/^"|"$/g, '');

            const stationId = cols[0]?.trim();
            const date = cols[2]?.trim();
            const elevation = cols[3] ? parseFloat(cols[3]) : undefined;
            const lat = cols[4] ? parseFloat(cols[4]) : undefined;
            const lon = cols[5] ? parseFloat(cols[5]) : undefined;

            if (!stationId || !date || elevation === undefined || lat === undefined || lon === undefined) {
                return null;
            }

            const temperature = replaceWithUndefined(cols[9] ? parseFloat(cols[9]) : undefined);
            const minTemperature = replaceWithUndefined(cols[8] ? parseFloat(cols[8]) : undefined);
            const maxTemperature = replaceWithUndefined(cols[7] ? parseFloat(cols[7]) : undefined);
            const humidity = replaceWithUndefined(cols[6] ? parseFloat(cols[6]) : undefined);

            return {
                station: new Station(
                    stationId,
                    stationName,
                    elevation,
                    lat,
                    lon
                ),
                data: new StationData(
                    stationId,
                    date,
                    temperature,
                    minTemperature,
                    maxTemperature,
                    humidity
                )
            } satisfies LiveStationRecord;
        });

        const data: LiveStationRecord[] = parsed.filter((item): item is LiveStationRecord => item !== null);

        // Convert data to dictionary
        const stations: Record<string, Station> = {};
        const stationData: Record<string, StationData> = {};
        for (const item of data) {
            stations[item.station.id] = item.station;
            stationData[item.data.stationId] = item.data;
        }

        return { stations, stationData };
    } catch (error) {
        console.error(`Error fetching live data: ${(error as Error).message}`);
        throw error;
    }
};