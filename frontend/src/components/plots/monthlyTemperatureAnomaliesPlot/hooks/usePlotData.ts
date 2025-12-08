import { useMemo } from 'react';
import { useAppSelector } from '../../../../store/hooks/useAppSelector.js';
import { selectDataByStationId } from '../../../../store/slices/dailyHistoricalStationDataSlice.js';
import { useSelectedStationId } from '../../../../store/hooks/hooks.js';
import { getPercentileColor } from '../../../../utils/TemperatureUtils.js';
import type { RollingAverageRecordMap } from '../../../../classes/RollingAverageRecord.js';
import { useHistoricalDailyDataForStation } from '../../../../store/slices/historicalDataForStationSlice.js';
import DailyRecentByStation from '../../../../classes/DailyRecentByStation.js';

export type IYear = number;
export type SeriesValues = (number | null)[] & { length: 12 };

export interface ISeries {
    year: number;
    values: SeriesValues;
    stroke: string;
    strokeWidth: number;
}

export interface IPlotData {
    stationId: string;
    domain: [number, number];
    series: ISeries[];
    error: string | null;
}

const initialResult: IPlotData = {
    stationId: '',
    domain: [0, 0],
    series: [],
    error: null,
};

const REFERENCE_START_YEAR = 1961;
const REFERENCE_END_YEAR = 1990;
const RECENT_YEARS_COUNT = 10;
const COLOR_DOMAIN: [number, number] = [-10, 10];
export const CURRENT_YEAR_STROKE = '#ff5252';

export const usePlotData = (): IPlotData => {
    const stationId = useSelectedStationId();
    const data = useAppSelector((state) => selectDataByStationId(state, stationId));
    const dailyRecords = useHistoricalDailyDataForStation(stationId);

    return useMemo(() => {
        if (!stationId || data.stationId !== stationId) {
            return initialResult;
        }

        const monthlyMeans = data.monthlyMeans ?? {};
        const monthlyMeansByYear: Record<number, SeriesValues> = {};

        for (const [yearKey, values] of Object.entries(monthlyMeans)) {
            const year = Number.parseInt(yearKey, 10);
            if (!Number.isFinite(year)) continue;
            monthlyMeansByYear[year] = values.slice() as SeriesValues;
        }

        const currentYear = new Date().getFullYear();
        const {
            means: currentYearData,
            completedMonths,
        } = computeCurrentYearMonthlyMeans(dailyRecords, currentYear);
        const hasCurrentYearSeries = Boolean(currentYearData && completedMonths.size > 0);

        const allYears = Object.keys(monthlyMeansByYear)
            .map((year) => Number.parseInt(year, 10))
            .filter((year) => Number.isFinite(year))
            .sort((a, b) => a - b);

        if (allYears.length === 0 && !hasCurrentYearSeries) {
            return { stationId, domain: data.domain, series: [], error: null };
        }

        // Compute reference-period baseline per month (mean of 1961–1990)
        const referenceYears = allYears.filter((y) => y >= REFERENCE_START_YEAR && y <= REFERENCE_END_YEAR);
        const baseline: number[] = new Array(12).fill(NaN);
        for (let m = 0; m < 12; m += 1) {
            const vals: number[] = [];
            for (const y of referenceYears) {
                const arr = monthlyMeansByYear[y];
                const v = arr?.[m];
                if (typeof v === 'number' && Number.isFinite(v)) vals.push(v);
            }
            baseline[m] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : NaN;
        }

        const recentYears = allYears.filter((y) => y > REFERENCE_END_YEAR).slice(-RECENT_YEARS_COUNT);
        const yearsToShow = Array.from(new Set([/*...referenceYears,*/ ...recentYears])).sort((a, b) => a - b);

        const denominator = Math.max(allYears.length - 1, 1);
        const baseSeries: ISeries[] = [];
        let highlightedSeries: ISeries | null = null;

        // Build anomaly series for historical and recent years
        for (const year of yearsToShow) {
            const values = monthlyMeansByYear[year];
            if (!values) continue;
            const anomalies = values.map((v, i) => {
                const b = baseline[i]!;
                return typeof v === 'number' && Number.isFinite(v) && Number.isFinite(b) ? v - b : null;
            }) as SeriesValues;

            const yearPosition = allYears.indexOf(year);
            const colorValue = allYears.length > 1
                ? COLOR_DOMAIN[0] + (yearPosition / denominator) * (COLOR_DOMAIN[1] - COLOR_DOMAIN[0])
                : 0;
            const stroke = getPercentileColor(colorValue, COLOR_DOMAIN, 'Blue');
            baseSeries.push({ year, values: anomalies, stroke, strokeWidth: 2 });
        }

        // Current year anomalies (mask incomplete months)
        if (hasCurrentYearSeries) {
            const anomalies = currentYearData!.map((v, i) => {
                const b = baseline[i]!;
                if (!completedMonths.has(i)) return null;
                return typeof v === 'number' && Number.isFinite(v) && Number.isFinite(b) ? v - b : null;
            }) as SeriesValues;

            highlightedSeries = {
                year: currentYear,
                values: anomalies,
                stroke: CURRENT_YEAR_STROKE,
                strokeWidth: 3,
            };
        }

        return {
            stationId,
            domain: data.domain,
            series: highlightedSeries ? [...baseSeries, highlightedSeries] : baseSeries,
            error: null,
        };
    }, [stationId, data.stationId, data.monthlyMeans, data.domain, dailyRecords]);
};

const getDaysInMonth = (year: number, monthIndex: number): number => new Date(year, monthIndex + 1, 0).getDate();

function computeCurrentYearMonthlyMeans(
    dailyRecords: Record<string, DailyRecentByStation> | null,
    currentYear: number,
): { means: SeriesValues | null; completedMonths: Set<number> } {
    if (!dailyRecords) return { means: null, completedMonths: new Set<number>() };

    const sums = new Array(12).fill(0);
    const counts = new Array(12).fill(0);
    const dayPresence = Array.from({ length: 12 }, () => new Set<number>());

    for (const record of Object.values(dailyRecords)) {
        if (!record) continue;
        const parts = extractYMD(record.date);
        if (!parts || parts.year !== currentYear) continue;
        const { monthIndex, day } = parts;
        const meanTemp = record.meanTemperature;
        if (typeof meanTemp !== 'number' || !Number.isFinite(meanTemp)) continue;
        sums[monthIndex] += meanTemp;
        counts[monthIndex] += 1;
        dayPresence[monthIndex]?.add(day);
    }

    const means = new Array(12).fill(null) as SeriesValues;
    let hasData = false;
    const completedMonths = new Set<number>();

    for (let month = 0; month < 12; month += 1) {
        const count = counts[month];
        if (count > 0) {
            means[month] = sums[month] / count;
            hasData = true;
            const expectedDays = getDaysInMonth(currentYear, month);
            const daysSeen = dayPresence[month];
            if (daysSeen && daysSeen.size === expectedDays) {
                let missingDay = false;
                for (let day = 1; day <= expectedDays; day += 1) {
                    if (!daysSeen.has(day)) { missingDay = true; break; }
                }
                if (!missingDay) completedMonths.add(month);
            }
        }
    }

    return { means: hasData ? means : null, completedMonths };
}

function extractYMD(dateString: string): { year: number; monthIndex: number; day: number } | null {
    if (!dateString) return null;
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
    if (Number.isNaN(parsed.getTime())) return null;
    return { year: parsed.getFullYear(), monthIndex: parsed.getMonth(), day: parsed.getDate() };
}
