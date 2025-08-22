import { configureStore } from '@reduxjs/toolkit';
import cityDataReducer from './slices/cityDataSlice.js';
import selectedCityReducer from './slices/selectedCitySlice.js';
import stationsReducer from './slices/stationSlice.js';
import rememberedCitiesReducer from './slices/rememberedCitiesSlice.js';
import selectedDateReducer from './slices/selectedDateSlice.js';
import yearlyMeanByDayReducer from './slices/YearlyMeanByDaySlice.js';
import referenceYearlyHourlyInterpolatedByDayReducer from './slices/ReferenceYearlyHourlyInterpolatedByDaySlice.js';
import liveDataReducer from './slices/liveDataSlice.js';
import rollingAverageDataReducer from './slices/rollingAverageDataSlice.js';
import historicalDailyDataReducer from './slices/historicalDataForStationSlice.js';
import dailyRecentByDateReducer from './slices/DailyRecentByDateSlice.js';

export const store = configureStore({
    reducer: {
        cityData: cityDataReducer,
        liveData: liveDataReducer,
        yearlyMeanByDay: yearlyMeanByDayReducer,
        referenceYearlyHourlyInterpolatedByDay: referenceYearlyHourlyInterpolatedByDayReducer,
        selectedCity: selectedCityReducer,
        rememberedCities: rememberedCitiesReducer,
        selectedDate: selectedDateReducer,
        rollingAverageData: rollingAverageDataReducer,
        stations: stationsReducer,
        historicalDailyData: historicalDailyDataReducer,
        dailyRecentByDate: dailyRecentByDateReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;