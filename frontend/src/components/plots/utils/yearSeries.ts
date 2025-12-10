import type DailyRecentByStation from "../../../classes/DailyRecentByStation";
import { extractYMD } from "../../../utils/dateUtils";

export const toLinePoint = (values: readonly (number | null)[], label: string): ILinePoint[] =>
    Array.from(values, (v, i) => ({ x: i, y: v, label }));

export interface ILinePoint {
    x: number;
    y: number | null;
    label: string;
}

export interface ILineSeries {
    label: string;
    strokeWidth: number;
    strokeOpacity: number;
    values: ILinePoint[];
}

export interface IMonthsInYearsPlotData {
    stationId: string;
    domain: [number, number];
    error: string | null;
    // Unified data structure for Observable Plot legend support
    series: ILineSeries[];
    // Optional color scale configuration for Observable Plot
    colorDomain: string[];
    colorRange: string[];
}

const getDaysInMonth = (year: number, monthIndex: number): number => new Date(year, monthIndex + 1, 0).getDate();

// Derive current-year monthly means and identify months with full daily coverage.
export function computeMeansOfMonthsOfCurrentYear(
    dailyRecords: Record<string, DailyRecentByStation> | null,
    currentYear: number,
): { means: (number | null)[] | null; completedMonths: Set<number> } {
    if (!dailyRecords) {
        return { means: null, completedMonths: new Set<number>() };
    }

    const sums = new Array(12).fill(0);
    const counts = new Array(12).fill(0);

    for (const record of Object.values(dailyRecords)) {
        if (!record) {
            continue;
        }

        const parts = extractYMD(record.date);
        if (!parts || parts.year !== currentYear) {
            continue;
        }

        const { monthIndex, day } = parts;
        const tasmax = record.meanTemperature;
        if (typeof tasmax !== 'number' || !Number.isFinite(tasmax)) {
            continue;
        }

        sums[monthIndex] += tasmax;
        counts[monthIndex] += 1;
    }

    const means = new Array(12).fill(null) as (number | null)[];
    let hasData = false;
    const completedMonths = new Set<number>();

    for (let month = 0; month < 12; month += 1) {
        const count = counts[month];
        const expectedDays = getDaysInMonth(currentYear, month);
        if (count > 0 && count === expectedDays) {
            means[month] = sums[month] / count;
            completedMonths.add(month);
            hasData = true;
        }
    }

    return {
        means: hasData ? means : null,
        completedMonths,
    };
}

export const computeMeansOfMonthsOverYears = (
    mm: Record<number, (number | null)[] | undefined>,
    startYear: number,
    endYear: number,
): (number | null)[] => {
    return Array.from({ length: 12 }, (_, m) => {
        let sum = 0;
        let count = 0;
        for (let y = startYear; y <= endYear; y++) {
            const v = mm[y]?.[m];
            if (typeof v === 'number' && Number.isFinite(v)) {
                sum += v;
                count += 1;
            }
        }
        return count ? sum / count : null;
    });
};