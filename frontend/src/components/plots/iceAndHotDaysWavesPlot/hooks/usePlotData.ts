import { useMemo } from 'react';
import { useAppSelector } from '../../../../store/hooks/useAppSelector.js';
import { selectDataByStationId } from '../slices/dataSlice.js';
import { useSelectedStationId } from '../../../../store/hooks/hooks.js';
import { useHistoricalDailyDataForStation } from '../../../../store/slices/historicalDataForStationSlice.js';
import {
    computeMeansOfMonthsOfCurrentYear,
    toLinePoint,
    type ILineSeries,
    type IMonthsInYearsPlotData
} from '../../utils/yearSeries.js';

const initialResult: IMonthsInYearsPlotData = {
    stationId: '',
    domain: [0, 0],
    error: null,
    series: [],
    colorDomain: [],
    colorRange: [],
};

const REFERENCE_START_YEAR = 1961;
const REFERENCE_END_YEAR = 1990;

export const usePlotData = (): IMonthsInYearsPlotData => {
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

        const unifiedSeries: ILineSeries[] = [];

        // Reference years (1961-1990) as light gray lines
        const referenceYears = allYears.filter((year) => year >= REFERENCE_START_YEAR && year <= REFERENCE_END_YEAR);
        const referenceLabel = `${REFERENCE_START_YEAR}-${REFERENCE_END_YEAR}`;
        for (const year of referenceYears) {
            const values = monthlyMeans[year];
            if (!values) {
                continue;
            }
            unifiedSeries.push({
                label: referenceLabel,
                strokeWidth: 1,
                strokeOpacity: 0.5,
                values: toLinePoint(values, referenceLabel),
            });
        }

        // Last year as yellow line
        const lastYear = allYears.slice(-1)[0]!;
        const values = monthlyMeans[lastYear];
        if (values) {
            unifiedSeries.push({
                label: String(lastYear),
                strokeWidth: 2,
                strokeOpacity: 1,
                values: toLinePoint(values, String(lastYear)),
            });
        }

        // Get monthly means of the current year
        const currentYear = new Date().getFullYear();
        const {
            means: currentYearMeans,
            completedMonths: currentYearCompletedMonths,
        } = computeMeansOfMonthsOfCurrentYear(dailyRecords, currentYear);
        if (currentYearMeans && currentYearCompletedMonths.size > 0) {
            unifiedSeries.push({
                label: String(currentYear),
                strokeWidth: 2,
                strokeOpacity: 1,
                values: toLinePoint(currentYearMeans, String(currentYear)),
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
    }, [stationId, data, dailyRecords]);
};