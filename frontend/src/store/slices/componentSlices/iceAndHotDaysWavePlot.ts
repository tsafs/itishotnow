import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../index.js';
import { useAppSelector } from '../../hooks/useAppSelector.js';

export type TState = {
    renderComplete: boolean;
};

const initialState: TState = {
    renderComplete: false,
};

const slice = createSlice({
    name: 'iceAndHotDaysWavesPlot',
    initialState,
    reducers: {
        setRenderComplete: (state, action: PayloadAction<boolean>) => {
            state.renderComplete = action.payload;
        },
        resetRenderComplete: (state) => {
            state.renderComplete = false;
        },
    },
});

export const selectRenderComplete = (state: RootState) =>
    state.iceAndHotDaysWavesPlot.renderComplete;

export const useRenderComplete = (): boolean => {
    return useAppSelector(selectRenderComplete);
};

export const {
    setRenderComplete,
    resetRenderComplete,
} = slice.actions;

export default slice.reducer;