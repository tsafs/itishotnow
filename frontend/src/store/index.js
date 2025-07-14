import { configureStore } from '@reduxjs/toolkit';
import citiesReducer from './slices/citiesSlice';
import selectedCityReducer from './slices/selectedCitySlice';
import rememberedCitiesReducer from './slices/rememberedCitiesSlice';
import selectedDateReducer from './slices/selectedDateSlice';

export const store = configureStore({
    reducer: {
        cities: citiesReducer,
        selectedCity: selectedCityReducer,
        rememberedCities: rememberedCitiesReducer,
        selectedDate: selectedDateReducer,
    },
});
