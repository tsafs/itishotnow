import { createSlice } from '@reduxjs/toolkit';

const rememberedCitiesSlice = createSlice({
    name: 'rememberedCities',
    initialState: [],
    reducers: {
        addRememberedCity: (state, action) => {
            const cityIdToAdd = action.payload;

            // Check if city is already remembered
            const alreadyExists = state.some(cityId => cityId === cityIdToAdd);

            if (!alreadyExists) {
                state.push(cityIdToAdd);
            }
        },
        clearRememberedCities: () => {
            return [];
        },
    },
});

export const { addRememberedCity, clearRememberedCities } = rememberedCitiesSlice.actions;
export default rememberedCitiesSlice.reducer;