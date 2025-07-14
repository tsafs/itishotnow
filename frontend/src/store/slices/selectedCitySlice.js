import { createSlice } from '@reduxjs/toolkit';

const selectedCitySlice = createSlice({
    name: 'selectedCity',
    initialState: null,
    reducers: {
        setSelectedCity: (state, action) => {
            return action.payload;
        },
    },
});

export const { setSelectedCity } = selectedCitySlice.actions;
export default selectedCitySlice.reducer;
