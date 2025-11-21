import { useMemo } from 'react';
import { fetchDailyRecentByDateData } from '../../services/DailyRecentByDateService.js';
import { useAppSelector } from '../hooks/useAppSelector.js';
import type { RootState } from '../index.js';
import type { IStationDataByStationId } from '../../classes/DailyRecentByStation.js';
import { createDataSlice } from '../factories/createDataSlice.js';

// Type for 'YYYY-MM-DD' string
export type DateKey = `${number}-${number}-${number}`;

// Arguments for thunk
export interface DailyRecentByDateArgs {
    year: number;
    month: number;
    day: number;
}

/**
 * Create dailyRecentByDate slice using factory with keyed state
 */
const { slice, actions, selectors } = createDataSlice<
    IStationDataByStationId,
    DailyRecentByDateArgs,
    'keyed',
    never,
    DateKey
>({
    name: 'dailyRecentByDate',
    fetchFn: ({ year, month, day }) => fetchDailyRecentByDateData({ year, month, day }),
    stateShape: 'keyed',
    cache: {
        strategy: 'by-key',
        keyExtractor: ({ year, month, day }) => `${year}-${month}-${day}` as DateKey,
        ttl: 3600000, // 1 hour
    },
});

// Export actions
export const fetchDailyRecentByDate = actions.fetch;

// Selector hooks
export const useDailyRecentByDate = ({ year, month, day }: DailyRecentByDateArgs): IStationDataByStationId | null => {
    const data = useAppSelector(selectors.selectData) as Record<DateKey, IStationDataByStationId> | undefined;
    return useMemo(() => {
        if (!data) return null;
        return data[`${year}-${month}-${day}`] ?? null;
    }, [data, year, month, day]);
};

export default slice.reducer;
