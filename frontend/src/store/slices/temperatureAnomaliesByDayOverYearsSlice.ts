import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index.js';
import { useAppSelector } from '../hooks/useAppSelector.js';

export type TemperatureAnomaliesByDayOverYearsState = {
    cityChangeRenderComplete: boolean;
};

const initialState: TemperatureAnomaliesByDayOverYearsState = {
    cityChangeRenderComplete: false,
};

const temperatureAnomaliesByDayOverYearsSlice = createSlice({
    name: 'temperatureAnomaliesByDayOverYears',
    initialState,
    reducers: {
        setCityChangeRenderComplete: (state, action: PayloadAction<boolean>) => {
            state.cityChangeRenderComplete = action.payload;
        },
        resetCityChangeRenderComplete: (state) => {
            state.cityChangeRenderComplete = false;
        },
    },
});

export const selectCityChangeRenderComplete = (state: RootState) =>
    state.temperatureAnomaliesByDayOverYears.cityChangeRenderComplete;

export const useTemperatureAnomaliesRenderComplete = (): boolean => {
    return useAppSelector(selectCityChangeRenderComplete);
};

export const {
    setCityChangeRenderComplete,
    resetCityChangeRenderComplete,
} = temperatureAnomaliesByDayOverYearsSlice.actions;

export default temperatureAnomaliesByDayOverYearsSlice.reducer;
