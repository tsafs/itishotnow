import { useMemo } from 'react';
import { useAppSelector } from '../../../../store/hooks/useAppSelector.js';
import { selectDataByStationId, type IYearData } from '../../../../store/slices/dailyHistoricalStationDataSlice.js';
import { useSelectedStationId } from '../../../../store/hooks/hooks.js';
import { useHistoricalDailyDataForStation } from '../../../../store/slices/historicalDataForStationSlice.js';
import DailyRecentByStation from '../../../../classes/DailyRecentByStation.js';
import { computeMeanOfSeries, type ISeries } from '../../utils/yearSeries.js';

export type IYear = number;

export interface IPlotData {
    stationId: string;
    domain: [number, number];
    referenceYears: ISeries[];
    lastYear: ISeries | null;
    currentYear: ISeries | null;
    mean: ISeries | null;
    error: string | null;
}

const initialResult: IPlotData = {
    stationId: '',
    domain: [0, 0],
    referenceYears: [],
    lastYear: null,
    currentYear: null,
    mean: null,
    error: null,
};

const REFERENCE_START_YEAR = 1961;
const REFERENCE_END_YEAR = 1990;

export const usePlotData = (): IPlotData => {
    const stationId = useSelectedStationId();
    const data = useAppSelector((state) => selectDataByStationId(state, stationId));
    const dailyRecords = useHistoricalDailyDataForStation(stationId);

    return useMemo(() => {
        // Validate station ID
        if (!stationId || data.stationId !== stationId) {
            return initialResult;
        }

        const monthlyMeans = data.monthlyMeans ?? {};

        // Get all years as numbers and sorted
        const allYears = Object.keys(monthlyMeans)
            .map((year) => Number.parseInt(year, 10))
            .filter((year) => Number.isFinite(year))
            .sort((a, b) => a - b);

        // No data available
        if (!allYears.length) {
            return initialResult;
        }

        // Reference years (1961-1990) as light gray lines
        const referenceYears = allYears.filter((year) => year >= REFERENCE_START_YEAR && year <= REFERENCE_END_YEAR);
        const referenceYearsData: ISeries[] = [];
        for (const year of referenceYears) {
            const values = monthlyMeans[year];
            if (!values) {
                continue;
            }
            referenceYearsData.push({
                year,
                values: values.slice() as IYearData,
                stroke: "#eeeeee",
                strokeWidth: 1,
                strokeOpacity: 0.1,
            });
        }

        // Last year as yellow line
        const lastYear = allYears.slice(-1)[0]!;
        const values = monthlyMeans[lastYear];
        let lastYearData: ISeries | null = null;
        if (values) {
            lastYearData = {
                year: lastYear,
                values: values.slice() as IYearData,
                stroke: "#ffcc00",
                strokeWidth: 2,
                strokeOpacity: 1,
            };
        }

        // Get monthly means of the current year
        const currentYear = new Date().getFullYear();
        const {
            means: currentYearMeans,
            completedMonths: currentYearCompletedMonths,
        } = computeCurrentYearMonthlyMeans(dailyRecords, currentYear);
        let currentYearData: ISeries | null = null;
        if (currentYearMeans && currentYearCompletedMonths.size > 0) {
            currentYearData = {
                year: currentYear,
                values: currentYearMeans!.slice() as IYearData,
                stroke: "#ff5252",
                strokeWidth: 2,
                strokeOpacity: 1,
            };
        }

        // Mean curve across reference years
        let meanData: ISeries | null = null;
        if (referenceYears.length > 0) {
            const meanAnomalies = computeMeanOfSeries(
                referenceYearsData
                    .filter((s) => referenceYears.includes(s.year))
                    .map(s => s.values)
            );
            meanData = {
                year: NaN,
                values: meanAnomalies,
                stroke: "#eeeeee",
                strokeWidth: 2,
                strokeOpacity: 1,
            };
        }

        return {
            stationId,
            domain: data.domain,
            referenceYears: referenceYearsData,
            mean: meanData,
            lastYear: lastYearData,
            currentYear: currentYearData,
            error: null,
        };
    }, [
        stationId,
        data.stationId,
        data.monthlyMeans,
        data.domain,
        dailyRecords,
    ]);
};

const getDaysInMonth = (year: number, monthIndex: number): number => new Date(year, monthIndex + 1, 0).getDate();

// Derive current-year monthly means and identify months with full daily coverage.
function computeCurrentYearMonthlyMeans(
    dailyRecords: Record<string, DailyRecentByStation> | null,
    currentYear: number,
): { means: IYearData | null; completedMonths: Set<number> } {
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

    const means = new Array(12).fill(null) as IYearData;
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