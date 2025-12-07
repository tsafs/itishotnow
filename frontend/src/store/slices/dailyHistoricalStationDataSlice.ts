import { fetchDailyDataForStation } from '../../services/RollingAverageDataService.js';
import type { RootState } from '../index.js';
import type { RollingAverageRecordMap } from '../../classes/RollingAverageRecord.js';
import { createDataSlice } from '../factories/createDataSlice.js';

export interface DailyHistoricalStationDataArgs {
    stationId: string;
}

export interface IData {
    stationId: string;
    data: RollingAverageRecordMap;
}

const fetchFn = async ({ stationId }: DailyHistoricalStationDataArgs): Promise<IData> => {
    const data = await fetchDailyDataForStation(stationId);;
    return {
        stationId,
        data,
    };
}

/**
 * Create rollingAverageData slice using factory
 */
const { slice, actions, selectors } = createDataSlice<
    IData,
    DailyHistoricalStationDataArgs,
    'simple'
>({
    name: 'dailyHistoricalStationData',
    fetchFn: fetchFn,
    stateShape: 'simple',
    cache: { strategy: 'none' }, // No caching - always fetch fresh for selected station
});

// Empty constant for rolling average data to avoid creating new [] object every time the state is empty
const EMPTY_DATA: IData = {
    stationId: '',
    data: {},
};

// Export actions
export const fetchData = actions.fetch;
export const resetData = actions.reset;

// Export selectors
export const selectData = (state: RootState): IData =>
    selectors.selectData(state) as IData ?? EMPTY_DATA;
export const selectDataStatus = selectors.selectStatus;
export const selectDataError = selectors.selectError;

export default slice.reducer;
