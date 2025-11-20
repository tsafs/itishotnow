import RollingAverageRecord, { type RollingAverageRecordList } from '../classes/RollingAverageRecord';

/**
 * Fetch rolling average climate metrics for a specific station.
 * 
 * Example CSV data:
 * 
 * date,tas
 * 1951-01-01,0.9
 * 1951-01-02,1.24
 * 1951-01-03,1.23
 * 1951-01-04,1.71
 * 1951-01-05,1.98
 * 1951-01-06,2.12
 * 1951-01-07,2.28
 * 1951-01-08,2.35
 * 1951-01-09,2.69
 * 1951-01-10,3.04
 * 1951-01-11,3.41
 * 1951-01-12,3.7
 * 
 * @param {string} stationId - Station ID to fetch rolling average data for
 * @returns {Promise<RollingAverageRecordList>} Rolling average data for the station
 */
export const fetchRollingAverageForStation = async (stationId: string): Promise<RollingAverageRecordList> => {

    try {
        // Construct the URL for the rolling average data
        const url = `/data/rolling_average/1951_2024/daily/${stationId}_1951-2024_avg_7d.csv`;

        const response = await fetch(url);

        // in case of a 404 error, error out
        if (!response.ok) {
            throw new Error(`Failed to fetch rolling average data for ${stationId} from 1951 to 2024: ${response.status} ${response.statusText}. Are you in the wrong timezone? Our data is based on UTC.`);
        }

        const text = await response.text();

        const lines = text.split('\n').filter(line => line.trim().length > 0);

        if (lines.length === 0) {
            throw new Error(`No data found for ${stationId} from 1951 to 2024.`);
        }

        const headerLine = lines[0] ?? '';
        const headers = headerLine.split(',').map(column => column.trim());
        if (headers.length === 0 || headers[0] !== 'date') {
            throw new Error(`Unexpected header format for rolling average data of ${stationId}.`);
        }

        const records: RollingAverageRecordList = [];

        for (const line of lines.slice(1)) {
            const columns = line.split(',').map(column => column.trim());
            const dateRaw = columns[0];

            if (!dateRaw) {
                continue;
            }

            const record = new RollingAverageRecord(dateRaw);

            for (let columnIndex = 1; columnIndex < headers.length; columnIndex += 1) {
                const metric = headers[columnIndex];
                if (!metric) {
                    continue;
                }

                if (columnIndex >= columns.length) {
                    continue;
                }

                const value = parseOptionalFloat(columns[columnIndex]);
                if (value === undefined) {
                    continue;
                }

                record.setMetric(metric, value);
            }

            records.push(record.toJSON());
        }

        if (records.length === 0) {
            throw new Error(`No data found for ${stationId} from 1951 to 2024.`);
        }

        return records;
    } catch (error) {
        console.error(`Error loading rolling average data for ${stationId} from 1951 to 2024:`, error);
        throw error;
    }
};

const parseOptionalFloat = (value: string | undefined): number | undefined => {
    if (!value) {
        return undefined;
    }

    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : undefined;
};