import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { DateTime } from 'luxon';
import { getNow } from '../../utils/dateUtils.js';
import { fetchYearlyMeanByDay } from './YearlyMeanByDaySlice.js';
import { fetchDailyRecentByDate } from './DailyRecentByDateSlice.js';
import { useAppSelector } from '../hooks/useAppSelector.js';
import type { AppThunk } from '../index.js';

export type SelectedDateState = string;

const initialSelectedDate: SelectedDateState = getNow().toISO() ?? new Date().toISOString();

const selectedDateSlice = createSlice({
    name: 'selectedDate',
    initialState: initialSelectedDate,
    reducers: {
        setSelectedDate: (_state, action: PayloadAction<string>) => action.payload,
    },
});

const { setSelectedDate } = selectedDateSlice.actions;

// Thunk to set date and fetch historical data
export const setDateAndFetchHistoricalData = (isoDateString: string): AppThunk => (dispatch) => {
    dispatch(setSelectedDate(isoDateString));
    const dt = DateTime.fromISO(isoDateString);
    if (!dt.isValid) {
        return;
    }
    dispatch(fetchYearlyMeanByDay({ month: dt.month, day: dt.day }));
    if (!dt.hasSame(getNow(), 'day')) {
        // If the date is not today, fetch daily recent data
        dispatch(fetchDailyRecentByDate({ year: dt.year, month: dt.month, day: dt.day }));
    }
};

export const useSelectedDate = (): SelectedDateState => {
    return useAppSelector(state => state.selectedDate);
};

export { setSelectedDate };
export default selectedDateSlice.reducer;
