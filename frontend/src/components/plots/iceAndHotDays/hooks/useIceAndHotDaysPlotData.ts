import { useMemo } from 'react';
import { useAppSelector } from '../../../../store/hooks/useAppSelector.js';
import XYData from '../../../../classes/XYData.js';
import { selectIceAndHotDaysData } from '../../../../store/slices/iceAndHotDaysDataSlice.js';
import type { IIceAndHotDaysForStation } from '../classes/IceAndHotDaysForStation.js';
import { useSelectedStationId } from '../../../../store/hooks/hooks.js';

interface BasePlotEntry {
    year: number;
    temperature: number;
    date: string;
    isPrimaryDay: boolean;
    isCurrent?: boolean;
}

export type PlotEntry = BasePlotEntry & { anomaly: number };

interface IceAndHotDaysPlotDataResult extends IIceAndHotDaysForStation {
    firstYear?: number;
    lastYear?: number;
    error: string | null;
}

const initialResult: IceAndHotDaysPlotDataResult = {
    stationId: '',
    iceDays: new XYData([], []),
    hotDays: new XYData([], []),
    error: null,
};

export const useIceAndHotDaysPlotData = (): IceAndHotDaysPlotDataResult => {
    const data = useAppSelector(selectIceAndHotDaysData);
    const stationId = useSelectedStationId();

    return useMemo(() => {
        if (!stationId || data.stationId !== stationId) {
            return initialResult;
        }
        return {
            stationId: data.stationId,
            iceDays: data.iceDays,
            hotDays: data.hotDays,
            firstYear: data.iceDays.x.length > 0 ? data.iceDays.x[0] : undefined,
            lastYear: data.iceDays.x.length > 0 ? data.iceDays.x[data.iceDays.x.length - 1] : undefined,
            error: null,
        };
    }, [
        stationId,
        data.stationId,
        data.iceDays,
        data.hotDays
    ]);
};

export type { IceAndHotDaysPlotDataResult as TemperatureAnomalyPlotDataResult };
