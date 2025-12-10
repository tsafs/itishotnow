import { useMemo } from 'react';
import { useAppSelector } from '../../../../store/hooks/useAppSelector.js';
import { selectDataByStationId } from '../../iceAndHotDaysWavesPlot/slices/dataSlice.js';
import { useSelectedStationId } from '../../../../store/hooks/hooks.js';
import { useHistoricalDailyDataForStation } from '../../../../store/slices/historicalDataForStationSlice.js';
import {
    computeMeansOfMonthsOfCurrentYear,
    computeMeansOfMonthsOverYears,
    toLinePoint,
    type ILineSeries,
    type IMonthsInYearsPlotData,
    type TSeriesValues
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
export const CURRENT_YEAR_STROKE = '#ff5252';

export const usePlotData = (): IMonthsInYearsPlotData => {
    const stationId = useSelectedStationId();
    const data = useAppSelector((state) => selectDataByStationId(state, stationId));
    const dailyRecords = useHistoricalDailyDataForStation(stationId);

    return useMemo(() => {
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

        // Compute 1961–1990 baseline
        const referenceMonthlyMeans = computeMeansOfMonthsOverYears(monthlyMeans, REFERENCE_START_YEAR, REFERENCE_END_YEAR);

        const unifiedSeries: ILineSeries[] = [];

        // Reference years (1961-1990) as light gray lines
        const referenceYears = allYears.filter((year) => year >= REFERENCE_START_YEAR && year <= REFERENCE_END_YEAR);
        const referenceLabel = `${REFERENCE_START_YEAR}-${REFERENCE_END_YEAR}`;
        for (const year of referenceYears) {
            const values = monthlyMeans[year];
            if (!values) {
                continue;
            }
            const anomalyValues = toAnomalies(values as TSeriesValues, referenceMonthlyMeans);
            unifiedSeries.push({
                label: referenceLabel,
                strokeWidth: 1,
                strokeOpacity: 0.3,
                values: toLinePoint(anomalyValues, referenceLabel),
            });
        }

        // Recent N years as light gray lines
        const lastYear = allYears.slice(-1)[0]!;
        const values = monthlyMeans[lastYear];
        if (values) {
            const anomalyValues = toAnomalies(values as TSeriesValues, referenceMonthlyMeans);
            unifiedSeries.push({
                label: String(lastYear),
                strokeWidth: 2,
                strokeOpacity: 1,
                values: toLinePoint(anomalyValues, String(lastYear)),
            });
        }

        // Get monthly means of the current year
        const currentYear = new Date().getFullYear();
        const {
            means: currentYearMeans,
            completedMonths: currentYearCompletedMonths,
        } = computeMeansOfMonthsOfCurrentYear(dailyRecords, currentYear);
        if (currentYearMeans && currentYearCompletedMonths.size > 0) {
            const currentAnomalies = toAnomalies(currentYearMeans as TSeriesValues, referenceMonthlyMeans);
            unifiedSeries.push({
                label: String(currentYear),
                strokeWidth: 2,
                strokeOpacity: 1,
                values: toLinePoint(currentAnomalies, String(currentYear)),
            });
        }

        // Define color scale mapping for legend
        const colorForLabel = (label: string): string => {
            if (label === String(currentYear)) return '#ff5252';
            if (label === String(lastYear)) return '#ffaa00';
            if (label === referenceLabel) return '#666666';
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

        // Compute anomaly domain from unified series values
        const getDomainFromSeries = (series: ILineSeries[]): [number, number] => {
            let minY = Number.POSITIVE_INFINITY;
            let maxY = Number.NEGATIVE_INFINITY;
            for (const s of series) {
                for (const p of s.values) {
                    if (typeof p.y === 'number' && Number.isFinite(p.y)) {
                        if (p.y < minY) minY = p.y;
                        if (p.y > maxY) maxY = p.y;
                    }
                }
            }
            return minY === Number.POSITIVE_INFINITY || maxY === Number.NEGATIVE_INFINITY
                ? [0, 0]
                : [minY, maxY];
        };

        const computedDomain = getDomainFromSeries(unifiedSeries);

        return {
            stationId,
            domain: computedDomain,
            error: null,
            series: unifiedSeries,
            colorDomain,
            colorRange,
        };
    }, [stationId, data, dailyRecords]);
};


const toAnomalies = (values: TSeriesValues, refMeans: (number | null)[]): TSeriesValues =>
    values.map((v, i) => {
        const ref = refMeans[i];
        return typeof v === 'number' && Number.isFinite(v) && typeof ref === 'number'
            ? v - ref
            : (v as number | null);
    }) as TSeriesValues;