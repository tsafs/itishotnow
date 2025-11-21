import { fetchRollingAverageForStation } from '../../services/RollingAverageDataService.js';
import type { RootState } from '../index.js';
import type { RollingAverageRecordList } from '../../classes/RollingAverageRecord.js';
import { createDataSlice } from '../factories/createDataSlice.js';

export interface FetchRollingAverageArgs {
    stationId: string;
}

/**
 * Create rollingAverageData slice using factory
 */
const { slice, actions, selectors } = createDataSlice<
    RollingAverageRecordList,
    FetchRollingAverageArgs,
    'simple'
>({
    name: 'rollingAverageData',
    fetchFn: ({ stationId }) => fetchRollingAverageForStation(stationId),
    stateShape: 'simple',
    cache: { strategy: 'none' }, // No caching - always fetch fresh for selected station
});

// Export actions
export const fetchRollingAverageData = actions.fetch;

// Export selectors
export const selectRollingAverageData = (state: RootState): RollingAverageRecordList =>
    selectors.selectData(state) as RollingAverageRecordList ?? [];
export const selectRollingAverageDataStatus = selectors.selectStatus;

export default slice.reducer;
