import { useMemo } from 'react';
import { useAppSelector } from '../../../../store/hooks/useAppSelector.js';
import { selectDataByStationId } from '../../../../store/slices/dailyHistoricalStationDataSlice.js';
import { useSelectedStationId } from '../../../../store/hooks/hooks.js';
import { getPercentileColor } from '../../../../utils/TemperatureUtils.js';

export type IYear = number;
export type IYearData = [...number[]] & { length: 12 };

export interface ISeries {
    year: number;
    values: IYearData;
    stroke: string;
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
const RECENT_YEARS_COUNT = 1;
const COLOR_DOMAIN: [number, number] = [-10, 10];

export const usePlotData = (): IPlotData => {
    const stationId = useSelectedStationId();
    const data = useAppSelector((state) => selectDataByStationId(state, stationId));

    return useMemo(() => {
        if (!stationId || data.stationId !== stationId) {
            return initialResult;
        }

        const monthlyMeans = data.monthlyMeans ?? {};
        const allYears = Object.keys(monthlyMeans)
            .map((year) => Number.parseInt(year, 10))
            .filter((year) => Number.isFinite(year))
            .sort((a, b) => a - b);

        if (allYears.length === 0) {
            return {
                stationId,
                domain: data.domain,
                series: [],
                error: null,
            };
        }

        const referenceYears = allYears.filter((year) => year >= REFERENCE_START_YEAR && year <= REFERENCE_END_YEAR);
        const recentYears = allYears
            .filter((year) => year > REFERENCE_END_YEAR)
            .slice(-RECENT_YEARS_COUNT);

        const yearsToShow = Array.from(new Set([...referenceYears, ...recentYears])).sort((a, b) => a - b);

        const denominator = Math.max(allYears.length - 1, 1);
        const series: ISeries[] = [];

        for (const year of yearsToShow) {
            const values = monthlyMeans[year];
            if (!values) {
                continue;
            }

            const yearPosition = allYears.indexOf(year);
            const colorValue = allYears.length > 1
                ? COLOR_DOMAIN[0] + (yearPosition / denominator) * (COLOR_DOMAIN[1] - COLOR_DOMAIN[0])
                : 0;
            const stroke = getPercentileColor(colorValue, COLOR_DOMAIN, 'Blue');

            series.push({
                year,
                values,
                stroke,
            });
        }

        return {
            stationId,
            domain: data.domain,
            series,
            error: null,
        };
    }, [
        stationId,
        data.stationId,
        data.monthlyMeans,
        data.domain,
    ]);
};