import { configureStore } from '@reduxjs/toolkit';
import cityDataReducer from './slices/cityDataSlice';
import selectedCityReducer from './slices/selectedCitySlice';
import rememberedCitiesReducer from './slices/rememberedCitiesSlice';
import selectedDateReducer from './slices/selectedDateSlice';
import historicalDataReducer from './slices/historicalDataSlice';
import interpolatedHourlyDataReducer from './slices/interpolatedHourlyDataSlice';
import liveDataReducer from './slices/liveDataSlice';
import rollingAverageDataReducer from './slices/rollingAverageDataSlice';

export const store = configureStore({
    reducer: {
        cityData: cityDataReducer,
        liveData: liveDataReducer,
        historicalData: historicalDataReducer,
        interpolatedHourlyData: interpolatedHourlyDataReducer,
        selectedCity: selectedCityReducer,
        rememberedCities: rememberedCitiesReducer,
        selectedDate: selectedDateReducer,
        rollingAverageData: rollingAverageDataReducer,
    },
});
