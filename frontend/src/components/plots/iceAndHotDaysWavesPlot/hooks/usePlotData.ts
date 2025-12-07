import { useMemo } from 'react';
import { useAppSelector } from '../../../../store/hooks/useAppSelector.js';
import { selectData } from '../../../../store/slices/dailyHistoricalStationDataSlice.js';
import { useSelectedStationId } from '../../../../store/hooks/hooks.js';

export type IYear = number;
export type IYearData = [...number[]] & { length: 365 };

export interface IPlotData {
    stationId: string;
    domain: [number, number];
    data: Record<IYear, IYearData>;
    error: string | null;
}

const initialResult: IPlotData = {
    stationId: '',
    domain: [0, 0],
    data: {},
    error: null,
};

export const usePlotData = (): IPlotData => {
    const data = useAppSelector(selectData);
    const stationId = useSelectedStationId();

    return useMemo(() => {
        if (!stationId || data.stationId !== stationId) {
            return initialResult;
        }

        const yearDataMap: Record<IYear, IYearData> = {};
        let currentYear: IYear | null = null;
        let dayIndex = 0;
        let minTemp = Infinity;
        let maxTemp = -Infinity;

        for (const record of Object.values(data.data)) {
            const date = new Date(record.date);
            const year = date.getFullYear();
            const month = date.getMonth();
            const dayOfMonth = date.getDate();

            // Skip Feb 29
            if (month === 1 && dayOfMonth === 29) {
                continue;
            }

            // Reset counter on new year
            if (currentYear !== year) {
                currentYear = year;
                dayIndex = 0;
                yearDataMap[year] = new Array(365).fill(0) as IYearData;
            }

            // Extract tasmax value
            const tasmax = record.getMetric('tasmax');
            if (tasmax !== undefined && yearDataMap[year]) {
                yearDataMap[year][dayIndex] = tasmax;
                minTemp = Math.min(minTemp, tasmax);
                maxTemp = Math.max(maxTemp, tasmax);
            }

            dayIndex++;
        }

        return {
            stationId,
            domain: [minTemp, maxTemp],
            data: yearDataMap,
            error: null,
        };
    }, [
        stationId,
        data.stationId,
        data.data
    ]);
};