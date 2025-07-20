import { createSlice } from '@reduxjs/toolkit';
import { useSelector } from 'react-redux';
import { getNow } from '../../utils/dateUtils';

const selectedDateSlice = createSlice({
    name: 'selectedDate',
    initialState: getNow().toISO(),
    reducers: {
        setSelectedDate: (_, action) => {
            return action.payload;
        },
    },
});

const { setSelectedDate } = selectedDateSlice.actions;

export const useSelectedDate = () => {
    return useSelector(state => state.selectedDate);
};

export { setSelectedDate };
export default selectedDateSlice.reducer;
