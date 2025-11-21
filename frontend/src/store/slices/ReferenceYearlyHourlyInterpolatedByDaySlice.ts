import { useMemo } from 'react';
import { fetchReferenceYearlyHourlyInterpolatedByDayData } from '../../services/ReferenceYearlyHourlyInterpolatedByDayService.js';
import { useAppSelector } from '../hooks/useAppSelector.js';
import type { ReferenceYearlyHourlyInterpolatedByDayByStationId } from '../../classes/ReferenceYearlyHourlyInterpolatedByDay.js';
import { createDataSlice } from '../factories/createDataSlice.js';
import type { RootState } from '../index.js';

export interface FetchReferenceYearlyHourlyInterpolatedByDayArgs {
    month: number;
    day: number;
}

export interface ReferenceYearlyHourlyInterpolatedByDayContext {
    month: number;
    day: number;
}

/**
 * Create referenceYearlyHourlyInterpolatedByDay slice using factory
 */
const { slice, actions, selectors } = createDataSlice<
    ReferenceYearlyHourlyInterpolatedByDayByStationId,
    FetchReferenceYearlyHourlyInterpolatedByDayArgs,
    'with-context',
    ReferenceYearlyHourlyInterpolatedByDayContext
>({
    name: 'referenceYearlyHourlyInterpolatedByDay',
    fetchFn: ({ month, day }) => fetchReferenceYearlyHourlyInterpolatedByDayData(month, day),
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
export const fetchReferenceYearlyHourlyInterpolatedByDay = actions.fetch;
export const clearHourlyData = actions.reset; // Map reset to clearHourlyData for compatibility

// Hooks
export const useReferenceYearlyHourlyInterpolatedByDayData = () => {
    const referenceYearlyHourlyInterpolatedByDay = useAppSelector(selectors.selectData) as ReferenceYearlyHourlyInterpolatedByDayByStationId | undefined;
    const currentDay = useAppSelector((state: RootState) => (state.referenceYearlyHourlyInterpolatedByDay as any).context) as ReferenceYearlyHourlyInterpolatedByDayContext | undefined;
    const status = useAppSelector(selectors.selectStatus);

    return useMemo(() => {
        if (status !== 'succeeded' || !referenceYearlyHourlyInterpolatedByDay || !currentDay) {
            return null;
        }
        return { data: referenceYearlyHourlyInterpolatedByDay, month: currentDay.month, day: currentDay.day };
    }, [referenceYearlyHourlyInterpolatedByDay, currentDay, status]);
};

export default slice.reducer;
