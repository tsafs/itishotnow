import { createSlice } from '@reduxjs/toolkit';
import { getNow } from '../../utils/dateUtils.js';
import { DateTime } from 'luxon';
import { fetchYearlyMeanByDay } from './YearlyMeanByDaySlice.js';
import { fetchDailyRecentByDate } from './DailyRecentByDateSlice.js';
import { useAppSelector } from '../hooks/useAppSelector.js';

const selectedDateSlice = createSlice({
    name: 'selectedDate',
    initialState: getNow().toISO(),
    reducers: {
        setSelectedDate: (state, action) => {
            return action.payload;
        },
    },
});

const { setSelectedDate } = selectedDateSlice.actions;

// Thunk to set date and fetch historical data
export const setDateAndFetchHistoricalData = (isoDateString) => (dispatch) => {
    dispatch(setSelectedDate(isoDateString));
    const dt = DateTime.fromISO(isoDateString);
    dispatch(fetchYearlyMeanByDay({ month: dt.month, day: dt.day }));
    if (!dt.hasSame(getNow(), 'day')) {
        // If the date is not today, fetch daily recent data
        dispatch(fetchDailyRecentByDate({ year: dt.year, month: dt.month, day: dt.day }));
    }
};

export const useSelectedDate = () => {
    return useAppSelector(state => state.selectedDate);
};

export { setSelectedDate };
export default selectedDateSlice.reducer;
