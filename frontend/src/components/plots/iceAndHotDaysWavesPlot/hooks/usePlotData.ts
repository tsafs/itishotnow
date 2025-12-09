import { useMemo } from 'react';
import { useAppSelector } from '../../../../store/hooks/useAppSelector.js';
import { selectDataByStationId, type IYearData } from '../../../../store/slices/dailyHistoricalStationDataSlice.js';
import { useSelectedStationId } from '../../../../store/hooks/hooks.js';
import { useHistoricalDailyDataForStation } from '../../../../store/slices/historicalDataForStationSlice.js';
import DailyRecentByStation from '../../../../classes/DailyRecentByStation.js';
import { computeMeanOfSeries, type ISeries } from '../../utils/yearSeries.js';

export type IYear = number;


// Types for unified series used by Observable Plot
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

const initialResult: IPlotData = {
    stationId: '',
    domain: [0, 0],
    error: null,
    series: [],
    colorDomain: [],
    colorRange: [],
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

        // Helpers
        const toPoints = (values: IYearData, label: string): ISeriesPoint[] => values.map((v, i) => ({ x: i, y: v, label }));
        const unifiedSeries: ILineSeries[] = [];

        // Reference years (1961-1990) as light gray lines
        const referenceYears = allYears.filter((year) => year >= REFERENCE_START_YEAR && year <= REFERENCE_END_YEAR);
        const referenceYearsData: ISeries[] = [];
        const referenceLabel = `${REFERENCE_START_YEAR}-${REFERENCE_END_YEAR}`;
        for (const year of referenceYears) {
            const values = monthlyMeans[year];
            if (!values) {
                continue;
            }
            const series: ISeries = {
                year,
                values: values.slice() as IYearData,
                stroke: "#eeeeee",
                strokeWidth: 1,
                strokeOpacity: 0.3,
            };
            referenceYearsData.push(series);
            unifiedSeries.push({
                label: referenceLabel,
                strokeWidth: series.strokeWidth,
                strokeOpacity: series.strokeOpacity,
                values: toPoints(series.values, referenceLabel),
            });
        }

        // Mean curve across reference years
        // if (referenceYears.length > 0) {
        //     const meanAnomalies = computeMeanOfSeries(
        //         referenceYearsData
        //             .filter((s) => referenceYears.includes(s.year))
        //             .map(s => s.values)
        //     );
        //     unifiedSeries.push({
        //         label: `${referenceLabel} Mittel`,
        //         strokeWidth: 2,
        //         strokeOpacity: 1,
        //         values: toPoints(meanAnomalies, `${referenceLabel} Mittel`),
        //     });
        // }

        // Last year as yellow line
        const lastYear = allYears.slice(-1)[0]!;
        const values = monthlyMeans[lastYear];
        if (values) {
            unifiedSeries.push({
                label: String(lastYear),
                strokeWidth: 2,
                strokeOpacity: 1,
                values: toPoints(values.slice() as IYearData, String(lastYear)),
            });
        }

        // Get monthly means of the current year
        const currentYear = new Date().getFullYear();
        const {
            means: currentYearMeans,
            completedMonths: currentYearCompletedMonths,
        } = computeCurrentYearMonthlyMeans(dailyRecords, currentYear);
        if (currentYearMeans && currentYearCompletedMonths.size > 0) {
            unifiedSeries.push({
                label: String(currentYear),
                strokeWidth: 2,
                strokeOpacity: 1,
                values: toPoints(currentYearMeans!.slice() as IYearData, String(currentYear)),
            });
        }

        // Define color scale mapping for legend
        const colorForLabel = (label: string): string => {
            if (label === String(currentYear)) return '#ff5252';
            if (label === String(lastYear)) return '#ffcc00';
            if (label === referenceLabel) return '#666666';
            if (label.endsWith('Mittel')) return '#eeeeee';
            return '#666666';
        };
        const colorDomain: string[] = [];
        const colorRange: string[] = [];
        const seen = new Set<string>();
        for (const s of unifiedSeries) {
            if (!seen.has(s.label)) {
                seen.add(s.label);
                colorDomain.push(s.label);
                colorRange.push(colorForLabel(s.label));
            }
        }

        return {
            stationId,
            domain: data.domain,
            error: null,
            series: unifiedSeries,
            colorDomain,
            colorRange,
        };
    }, [
        stationId,
        data,
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