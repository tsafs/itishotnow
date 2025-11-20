
import ReferenceYearlyHourlyInterpolatedByDay, {
    type ReferenceHourKey,
    type ReferenceYearlyHourlyInterpolatedByDayByStationId,
} from '../classes/ReferenceYearlyHourlyInterpolatedByDay';

/**
 * Service to fetch interpolated hourly historical temperature data for a specific day
 */
export const fetchReferenceYearlyHourlyInterpolatedByDayData = async (
    month: number,
    day: number,
): Promise<ReferenceYearlyHourlyInterpolatedByDayByStationId> => {
    try {
        // Format month and day to ensure they have leading zeros
        const formattedMonth = String(month).padStart(2, '0');
        const formattedDay = String(day).padStart(2, '0');

        const url = `/data/interpolated_hourly/1961_1990/interpolated_hourly_temperatures_1961_1990_${formattedMonth}_${formattedDay}.csv`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch interpolated hourly data: ${response.status} ${response.statusText}`);
        }

        const text = await response.text();
        const lines = text.split('\n').filter(line => line.trim().length > 0);

        if (lines.length === 0) {
            throw new Error(`No interpolated hourly data found for day ${formattedMonth}/${formattedDay}.`);
        }

        const header = (lines[0] ?? '').split(',').map(column => column.trim());
        if (header.length === 0) {
            throw new Error(`Missing header for interpolated hourly data of ${formattedMonth}/${formattedDay}.`);
        }

        const result: ReferenceYearlyHourlyInterpolatedByDayByStationId = {};

        for (const line of lines.slice(1)) {
            const values = line.split(',').map(value => value.trim());
            const stationId = values[0];

            if (!stationId) {
                continue;
            }

            const record = new ReferenceYearlyHourlyInterpolatedByDay(stationId);

            for (let columnIndex = 1; columnIndex < header.length; columnIndex += 1) {
                const columnName = header[columnIndex];
                const hourKey = parseHourKey(columnName);

                if (!hourKey) {
                    continue;
                }

                if (columnIndex >= values.length) {
                    continue;
                }

                const value = parseOptionalFloat(values[columnIndex]);
                if (value === undefined) {
                    continue;
                }

                record.setHourValue(hourKey, value);
            }

            result[stationId] = record.toJSON();
        }

        if (Object.keys(result).length === 0) {
            throw new Error(`No hourly data rows parsed for day ${formattedMonth}/${formattedDay}.`);
        }

        return result;
    } catch (error) {
        console.error(`Error loading interpolated hourly data for day ${month}/${day}:`, error);
        throw error;
    }
};

const parseHourKey = (value: string | undefined): ReferenceHourKey | null => {
    if (!value) {
        return null;
    }

    const match = /^hour_(\d{1,2})$/.exec(value);
    if (!match) {
        return null;
    }

    const hour = Number.parseInt(match[1] ?? '', 10);
    if (Number.isNaN(hour) || hour < 0 || hour > 23) {
        return null;
    }

    return value as ReferenceHourKey;
};

const parseOptionalFloat = (value: string | undefined): number | undefined => {
    if (!value) {
        return undefined;
    }

    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : undefined;
};