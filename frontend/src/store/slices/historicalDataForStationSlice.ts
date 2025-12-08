import { fetchDailyWeatherStationData } from '../../services/HistoricalDataForStationService.js';
import { useMemo } from 'react';
import { useAppSelector } from '../hooks/useAppSelector.js';
import type { IStationDataByDate } from '../../classes/DailyRecentByStation.js';
import DailyRecentByStation from '../../classes/DailyRecentByStation.js';
import type { RootState } from '../index.js';
import { createDataSlice } from '../factories/createDataSlice.js';

/**
 * Fetch arguments for historical data
 */
export interface DailyDataForStationArgs {
    stationId: string;
}

/**
 * Create historicalDailyData slice using factory with keyed state
 * Stores daily weather data per station
 */
const { slice, actions, selectors } = createDataSlice<
    IStationDataByDate,
    DailyDataForStationArgs,
    'keyed',
    never,
    string
>({
    name: 'historicalDailyData',
    fetchFn: async ({ stationId }) => {
        const { data } = await fetchDailyWeatherStationData(stationId);
        // Convert to JSON for storage
        return Object.fromEntries(
            Object.entries(data).map(([date, obj]) => [date, obj.toJSON()])
        );
    },
    stateShape: 'keyed',
    cache: {
        strategy: 'by-key',
        keyExtractor: ({ stationId }) => stationId,
        ttl: 3600000 // 1 hour
    }
});

export const fetchDailyDataForStation = actions.fetch;
export const selectDataStatus = selectors.selectStatus;
export const selectDataError = selectors.selectError;

// Hook to get historical data for a station (returns DailyRecentByStation instances)
export const useHistoricalDailyDataForStation = (stationId: string | null | undefined): Record<string, DailyRecentByStation> | null => {
    const data = useAppSelector(selectors.selectData) as Record<string, IStationDataByDate> | undefined;

    return useMemo(() => {
        if (!stationId || !data) return null;

        const stationData = data[stationId];
        if (!stationData) return null;

        return Object.fromEntries(
            Object.entries(stationData).map(([date, json]) => [date, DailyRecentByStation.fromJSON(json)])
        );
    }, [data, stationId]);
};

export default slice.reducer;
