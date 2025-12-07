import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index.js';
import { useAppSelector } from '../hooks/useAppSelector.js';

export type IceAndHotDaysState = {
    cityChangeRenderComplete: boolean;
};

const initialState: IceAndHotDaysState = {
    cityChangeRenderComplete: false,
};

const iceAndHotDaysSlice = createSlice({
    name: 'iceAndHotDaysWavesPlot',
    initialState,
    reducers: {
        setIceAndHotDaysRenderComplete: (state, action: PayloadAction<boolean>) => {
            state.cityChangeRenderComplete = action.payload;
        },
        resetIceAndHotDaysRenderComplete: (state) => {
            state.cityChangeRenderComplete = false;
        },
    },
});

export const selectIceAndHotDaysRenderComplete = (state: RootState) =>
    state.iceAndHotDays.cityChangeRenderComplete;

export const useIceAndHotDaysRenderComplete = (): boolean => {
    return useAppSelector(selectIceAndHotDaysRenderComplete);
};

export const {
    setIceAndHotDaysRenderComplete,
    resetIceAndHotDaysRenderComplete,
} = iceAndHotDaysSlice.actions;

export default iceAndHotDaysSlice.reducer;