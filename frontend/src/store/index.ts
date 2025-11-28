import { configureStore } from '@reduxjs/toolkit';
import type { Action, ThunkAction } from '@reduxjs/toolkit';
import cityDataReducer from './slices/cityDataSlice.js';
import selectedCityReducer from './slices/selectedCitySlice.js';
import rememberedCitiesReducer from './slices/rememberedCitiesSlice.js';
import selectedDateReducer from './slices/selectedDateSlice.js';
import yearlyMeanByDayReducer from './slices/YearlyMeanByDaySlice.js';
import referenceYearlyHourlyInterpolatedByDayReducer from './slices/ReferenceYearlyHourlyInterpolatedByDaySlice.js';
import liveDataReducer from './slices/liveDataSlice.js';
import rollingAverageDataReducer from './slices/rollingAverageDataSlice.js';
import historicalDailyDataReducer from './slices/historicalDataForStationSlice.js';
import geoJsonReducer from './slices/geoJsonSlice.js';
import dailyRecentByDateReducer from './slices/DailyRecentByDateSlice.js';
import stationDateRangesReducer from './slices/stationDateRangesSlice.js';
import heatmapGermanySlice from './slices/heatmapGermanySlice.js';

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
        historicalDailyData: historicalDailyDataReducer,
        dailyRecentByDate: dailyRecentByDateReducer,
        stationDateRanges: stationDateRangesReducer,
        geoJson: geoJsonReducer,
        heatmapGermany: heatmapGermanySlice,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                warnAfter: 64
            },
        }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, Action<string>>;