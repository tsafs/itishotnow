import { fetchYearlyMeanByDayData } from '../../services/YearlyMeanByDayService.js';
import { useMemo } from 'react';
import { useAppSelector } from '../hooks/useAppSelector.js';
import type { RootState } from '../index.js';
import type { YearlyMeanByDayByStationId } from '../../classes/YearlyMeanByDay.js';
import { createDataSlice } from '../factories/createDataSlice.js';

export interface FetchYearlyMeanByDayArgs {
    month: number;
    day: number;
}

export interface YearlyMeanByDayContext {
    month: number;
    day: number;
}

/**
 * Create yearlyMeanByDay slice using factory with context-based caching
 */
const { slice, actions, selectors, hooks } = createDataSlice<
    YearlyMeanByDayByStationId,
    FetchYearlyMeanByDayArgs,
    'with-context',
    YearlyMeanByDayContext
>({
    name: 'yearlyMeanByDay',
    fetchFn: ({ month, day }) => fetchYearlyMeanByDayData(month, day),
    stateShape: 'with-context',
    cache: {
        strategy: 'by-key',
        keyExtractor: ({ month, day }) => `${month}-${day}`,
        ttl: 3600000, // 1 hour
    },
    contextConfig: {
        initialContext: undefined,
        updateContext: ({ month, day }) => ({ month, day }),
    },
});

// Export actions
export const fetchYearlyMeanByDay = actions.fetch;

// Export selectors
export const selectYearlyMeanByDayData = (state: RootState): YearlyMeanByDayByStationId | undefined =>
    selectors.selectData(state) as YearlyMeanByDayByStationId | undefined;
export const selectYearlyMeanByDayStatus = selectors.selectStatus;

// Hooks
export const useYearlyMeanByDayData = (): YearlyMeanByDayByStationId | null => {
    const yearlyMeanByDay = useAppSelector(selectYearlyMeanByDayData);
    const status = useAppSelector(selectYearlyMeanByDayStatus);

    return useMemo(() => {
        if (status !== 'succeeded' || !yearlyMeanByDay) {
            return null;
        }
        return yearlyMeanByDay;
    }, [yearlyMeanByDay, status]);
};

export default slice.reducer;
