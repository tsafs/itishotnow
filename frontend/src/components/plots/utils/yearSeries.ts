import type DailyRecentByStation from "../../../classes/DailyRecentByStation";

export type SeriesValues = (number | null)[] & { length: 12 };

export interface ISeries {
    year: number;
    values: SeriesValues;
    stroke: string;
    strokeWidth: number;
    strokeOpacity: number;
}

export function computeMeanOfSeries(seriesList: SeriesValues[]): SeriesValues {
    const mean: SeriesValues = new Array(12).fill(null) as SeriesValues;

    for (let m = 0; m < 12; m += 1) {
        const vals: number[] = [];
        for (const series of seriesList) {
            const v = series[m];
            if (typeof v === 'number' && Number.isFinite(v)) vals.push(v);
        }
        mean[m] = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    }

    return mean;
}

export interface ISeriesPoint {
    x: number;
    y: number | null;
    label: string;
}

export interface ILineSeries {
    label: string;
    strokeWidth: number;
    strokeOpacity: number;
    values: ISeriesPoint[];
}

export interface IPlotData {
    stationId: string;
    domain: [number, number];
    error: string | null;
    // Unified data structure for Observable Plot legend support
    series: ILineSeries[];
    // Optional color scale configuration for Observable Plot
    colorDomain: string[];
    colorRange: string[];
}

export const toPoints = (values: SeriesValues, label: string): ISeriesPoint[] => values.map((v, i) => ({ x: i, y: v, label }));


const getDaysInMonth = (year: number, monthIndex: number): number => new Date(year, monthIndex + 1, 0).getDate();

// Derive current-year monthly means and identify months with full daily coverage.
export function computeCurrentYearMonthlyMeans(
    dailyRecords: Record<string, DailyRecentByStation> | null,
    currentYear: number,
): { means: SeriesValues | null; completedMonths: Set<number> } {
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

    const means = new Array(12).fill(null) as SeriesValues;
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

function extractYMD(dateString: string): { year: number; monthIndex: number; day: number } | null {
    if (!dateString) {
        return null;
    }

    if (/^\d{8}$/.test(dateString)) {
        const year = Number.parseInt(dateString.slice(0, 4), 10);
        const month = Number.parseInt(dateString.slice(4, 6), 10);
        const day = Number.parseInt(dateString.slice(6, 8), 10);

        if (Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)) {
            const monthIndex = month - 1;
            if (monthIndex >= 0 && monthIndex < 12 && day >= 1 && day <= 31) {
                return { year, monthIndex, day };
            }
        }
        return null;
    }

    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    return {
        year: parsed.getFullYear(),
        monthIndex: parsed.getMonth(),
        day: parsed.getDate(),
    };
}

export const computeReferenceMonthlyMeans = (mm: Record<number, SeriesValues | undefined>, start: number, end: number): (number | null)[] => {
    return Array.from({ length: 12 }, (_, m) => {
        let sum = 0;
        let count = 0;
        for (let y = start; y <= end; y++) {
            const v = mm[y]?.[m];
            if (typeof v === 'number' && Number.isFinite(v)) {
                sum += v;
                count += 1;
            }
        }
        return count ? sum / count : null;
    });
};