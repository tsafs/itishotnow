import { createDataSlice } from '../factories/createDataSlice.js';
import { fetchDailyWeatherStationData } from '../../services/HistoricalDataForStationService.js';
import type { DateRangeJSON } from '../../classes/DateRange.js';
import DateRange from '../../classes/DateRange.js';
import type { RootState } from '../index.js';
import { useMemo } from 'react';
import { useAppSelector } from '../hooks/useAppSelector.js';

/**
 * Fetch arguments for station date ranges
 */
export interface FetchStationDateRangeArgs {
    stationId: string;
}

/**
 * Create stationDateRanges slice using factory with keyed state
 * Caches date ranges per station (they rarely change)
 */
const { slice, actions, selectors } = createDataSlice<
    DateRangeJSON,
    FetchStationDateRangeArgs,
    'keyed',
    never,
    string
>({
    name: 'stationDateRanges',
    fetchFn: async ({ stationId }) => {
        const { dateRange } = await fetchDailyWeatherStationData(stationId);
        return dateRange.toJSON();
    },
    stateShape: 'keyed',
    cache: {
        strategy: 'by-key',
        keyExtractor: ({ stationId }) => stationId,
        ttl: 86400000 // 24 hours - date ranges change slowly
    }
});

// Export actions
export const fetchStationDateRange = actions.fetch;

// Export selectors
export const selectStationDateRangesStatus = selectors.selectStatus;
export const selectStationDateRangesError = selectors.selectError;

// Selector for date range by station ID
export const selectDateRangeForStation = (state: RootState, stationId: string | null | undefined): DateRange | null => {
    if (!stationId) return null;

    const data = selectors.selectData(state) as Record<string, DateRangeJSON> | undefined;
    const jsonRange = data?.[stationId];

    return jsonRange ? DateRange.fromJSON(jsonRange) : null;
};

// Hook for date range by station ID
export const useDateRangeForStation = (stationId: string | null | undefined): DateRange | null => {
    const data = useAppSelector(selectors.selectData) as Record<string, DateRangeJSON> | undefined;

    return useMemo(() => {
        if (!stationId || !data) return null;
        const jsonRange = data[stationId];
        return jsonRange ? DateRange.fromJSON(jsonRange) : null;
    }, [data, stationId]);
};

export default slice.reducer;
