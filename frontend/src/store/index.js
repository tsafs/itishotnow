import { configureStore } from '@reduxjs/toolkit';
import citiesReducer from './slices/citiesSlice';
import selectedCityReducer from './slices/selectedCitySlice';
import rememberedCitiesReducer from './slices/rememberedCitiesSlice';

export const store = configureStore({
    reducer: {
        cities: citiesReducer,
        selectedCity: selectedCityReducer,
        rememberedCities: rememberedCitiesReducer,
    },
});
