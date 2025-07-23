import { configureStore } from '@reduxjs/toolkit';
import cityDataReducer from './slices/cityDataSlice';
import selectedCityReducer from './slices/selectedCitySlice';
import stationsReducer from './slices/stationSlice';
import rememberedCitiesReducer from './slices/rememberedCitiesSlice';
import selectedDateReducer from './slices/selectedDateSlice';
import yearlyMeanByDayReducer from './slices/YearlyMeanByDaySlice';
import referenceYearlyHourlyInterpolatedByDayReducer from './slices/ReferenceYearlyHourlyInterpolatedByDaySlice';
import liveDataReducer from './slices/liveDataSlice';
import rollingAverageDataReducer from './slices/rollingAverageDataSlice';
import historicalDailyDataReducer from './slices/historicalDataForStationSlice';
import dailyRecentByDateReducer from './slices/DailyRecentByDateSlice';

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
