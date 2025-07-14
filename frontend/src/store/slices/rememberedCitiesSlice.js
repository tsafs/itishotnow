import { createSlice } from '@reduxjs/toolkit';

// Helper function to check if two cities are the same
const isSameCity = (city1, city2) => {
    if (!city1 || !city2) return false;
    return city1.city_name === city2.city_name &&
        city1.lat === city2.lat &&
        city1.lon === city2.lon;
};

const rememberedCitiesSlice = createSlice({
    name: 'rememberedCities',
    initialState: [],
    reducers: {
        addRememberedCity: (state, action) => {
            const cityToAdd = action.payload;
            // Check if city is already remembered
            const alreadyExists = state.some(city => isSameCity(city, cityToAdd));

            if (!alreadyExists) {
                state.push(cityToAdd);
            }
        },
        clearRememberedCities: () => {
            return [];
        },
    },
});

export const { addRememberedCity, clearRememberedCities } = rememberedCitiesSlice.actions;

export default rememberedCitiesSlice.reducer;