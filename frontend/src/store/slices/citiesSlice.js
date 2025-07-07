import { createSlice } from '@reduxjs/toolkit';

const citiesSlice = createSlice({
    name: 'cities',
    initialState: [],
    reducers: {
        setCities: (state, action) => {
            return action.payload;
        },
    },
});

export const { setCities } = citiesSlice.actions;
export default citiesSlice.reducer;
