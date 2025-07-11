import { createSlice } from '@reduxjs/toolkit';

const selectedDateSlice = createSlice({
    name: 'selectedDate',
    initialState: null,
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
