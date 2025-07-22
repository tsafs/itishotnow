import { createSlice } from '@reduxjs/toolkit';
import { useSelector } from 'react-redux';
import { getNow } from '../../utils/dateUtils';
import { DateTime } from 'luxon';
import { fetchHistoricalData } from './historicalDataSlice';
import { fetchDailyRecentByDate } from './DailyRecentByDateSlice';

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
    const dt = DateTime.fromFormat(isoDateString, 'yyyy-LL-dd');
    dispatch(fetchHistoricalData({ month: dt.month, day: dt.day }));
    if (!dt.hasSame(getNow(), 'day')) {
        // If the date is not today, fetch daily recent data
        dispatch(fetchDailyRecentByDate({ year: dt.year, month: dt.month, day: dt.day }));
    }
};

export const useSelectedDate = () => {
    return useSelector(state => state.selectedDate);
};

export { setSelectedDate };
export default selectedDateSlice.reducer;
