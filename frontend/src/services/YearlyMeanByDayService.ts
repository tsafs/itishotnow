import YearlyMeanByDay, { type YearlyMeanByDayByStationId } from '../classes/YearlyMeanByDay';

/**
 * Service to fetch historical average data for a specific day (month and day)
 * 
 * Example CSV data:
 * 
 * station_id,tasmin,tasmax,tas
 * 1792,-1.4,3.3,1.2
 * 6158,-3.6,1.6,-1.2
 * 4887,-4.0,1.5,-1.6
 * 6263,-3.0,2.6,-0.3
 * 5109,-3.4,1.4,-0.9
 * 3034,-4.5,0.2,-2.3
 * 13710,-4.1,2.4,-1.0
 * 4592,-3.5,1.7,-1.1
 * 
 * @param {number} month - Month (1-12)
 * @param {number} day - Day (1-31)
 * @returns {Promise<YearlyMeanByDayByStationId>} Yearly mean data by station ID
 */
export const fetchYearlyMeanByDayData = async (month: number, day: number): Promise<YearlyMeanByDayByStationId> => {
    try {
        // Format month and day to ensure they have leading zeros
        const formattedMonth = String(month).padStart(2, '0');
        const formattedDay = String(day).padStart(2, '0');

        const url = `/data/yearly_mean_by_day/1961_1990/${formattedMonth}_${formattedDay}.csv`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch historical data: ${response.status} ${response.statusText}`);
        }

        const text = await response.text();
        const lines = text.split('\n').filter(line => line.trim().length > 0);

        if (lines.length === 0) {
            throw new Error(`No yearly mean data found for ${formattedMonth}-${formattedDay}.`);
        }

        const result: YearlyMeanByDayByStationId = {};

        for (const line of lines.slice(1)) {
            const [stationIdRaw, tasminRaw, tasmaxRaw, tasRaw] = line.split(',').map(column => column.trim());
            if (!stationIdRaw) {
                continue;
            }

            const record = new YearlyMeanByDay(
                stationIdRaw,
                parseOptionalFloat(tasminRaw),
                parseOptionalFloat(tasmaxRaw),
                parseOptionalFloat(tasRaw),
            );

            result[record.stationId] = record.toJSON();
        }

        if (Object.keys(result).length === 0) {
            throw new Error(`No yearly mean data rows parsed for ${formattedMonth}-${formattedDay}.`);
        }

        return result;
    } catch (error) {
        console.error(`Error loading historical data for day ${month}/${day}:`, error);
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