import { createSlice } from '@reduxjs/toolkit';
import { getNow } from '../../utils/dateUtils';

const selectedDateSlice = createSlice({
    name: 'selectedDate',
    initialState: getNow().toISOString(),
    reducers: {
        setSelectedDate: (state, action) => {
            return action.payload;
        },
    },
});

const { setSelectedDate } = selectedDateSlice.actions;

export const selectDate = (date) => (dispatch) => {
    dispatch(setSelectedDate(date));
};

export { setSelectedDate };
export default selectedDateSlice.reducer;
