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
 * 
 * Example CSV data:
 * 
 * station_id,station_name,data_date,elevation,lat,lon,humidity,max_temperature,min_temperature,temperature
 * 3137,Mainz-Lerchenberg (ZDF),20.10.2025 22:20,199,49.9658,8.2049,88.2,14.4,8.9,12.9
 * 3147,Mallersdorf-Pfaffenberg-Oberlindhart,20.10.2025 22:20,390,48.7548,12.2118,82.7,13.5,3.6,9.3
 * 3155,Manderscheid-Sonnenhof,20.10.2025 22:20,415,50.1015,6.8009,99.1,14.5,9.2,9.9
 * 3158,Manschnow,20.10.2025 22:20,12,52.5468,14.5453,70.6,13.0,-0.3,9.4
 * 3164,"Cölbe, Kr. Marburg-Biedenkopf",20.10.2025 22:20,187,50.8492,8.7745,87.4,,,-999
 * 3166,Marienberg,20.10.2025 22:20,639,50.6511,13.1469,77.0,10.8,2.7,6.8
 * 3167,"Marienberg, Bad",20.10.2025 22:20,547,50.6621,7.9603,94.3,11.3,7.9,10.9
 * 3181,Markt Erlbach-Hagenhofen,20.10.2025 22:20,360,49.4875,10.6277,99.1,13.6,4.4,6.3
 * 
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