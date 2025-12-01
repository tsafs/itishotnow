import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index.js';
import { useAppSelector } from '../hooks/useAppSelector.js';

export interface HeatmapGermanyState {
    dateChangeRenderComplete: boolean;
}

const initialState: HeatmapGermanyState = {
    dateChangeRenderComplete: false,
};

const heatmapGermanySlice = createSlice({
    name: 'heatmapGermany',
    initialState,
    reducers: {
        setDateChangeRenderComplete: (state, action: PayloadAction<boolean>) => {
            state.dateChangeRenderComplete = action.payload;
        },
        resetDateChangeRenderComplete: (state) => {
            state.dateChangeRenderComplete = false;
        },
    },
});

export const selectDateChangeRenderComplete = (state: RootState) => state.heatmapGermany.dateChangeRenderComplete;
export const useHeatmapRenderComplete = (): boolean => {
    return useAppSelector(selectDateChangeRenderComplete);
};

export const { setDateChangeRenderComplete, resetDateChangeRenderComplete } = heatmapGermanySlice.actions;
export default heatmapGermanySlice.reducer;