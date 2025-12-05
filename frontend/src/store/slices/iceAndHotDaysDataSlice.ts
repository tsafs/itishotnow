import type { RootState } from '../index.js';
import { createDataSlice } from '../factories/createDataSlice.js';
import type { IIceAndHotDaysForStation } from '../../components/plots/iceAndHotDays/classes/IceAndHotDaysForStation.js';
import XYData from '../../classes/XYData.js';
import { fetchIceAndHotDays } from '../../components/plots/iceAndHotDays/services/IceAndHotDaysService.js';

export interface IceAndHotDaysArgs {
    stationId: string;
}

/**
 * Create iceAndHotDaysData slice using factory
 */
const { slice, actions, selectors } = createDataSlice<
    IIceAndHotDaysForStation,
    IceAndHotDaysArgs,
    'simple'
>({
    name: 'iceAndHotDaysData',
    fetchFn: ({ stationId }) => fetchIceAndHotDays(stationId),
    stateShape: 'simple',
    cache: { strategy: 'none' }, // No caching - always fetch fresh for selected station
});

// Empty constant for ice and hot days data to avoid creating new object every time the state is empty
const EMPTY_ICE_AND_HOT_DAYS: IIceAndHotDaysForStation = {
    stationId: '',
    iceDays: new XYData([], []),
    hotDays: new XYData([], [])
};

// Export actions
export const fetchIceAndHotDaysData = actions.fetch;
export const resetIceAndHotDaysData = actions.reset;

// Export selectors
export const selectIceAndHotDaysData = (state: RootState): IIceAndHotDaysForStation =>
    selectors.selectData(state) as IIceAndHotDaysForStation ?? EMPTY_ICE_AND_HOT_DAYS;
export const selectIceAndHotDaysDataStatus = selectors.selectStatus;
export const selectIceAndHotDaysDataError = selectors.selectError;

export default slice.reducer;
