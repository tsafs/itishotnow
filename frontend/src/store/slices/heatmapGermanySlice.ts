import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index.js';
import { useAppSelector } from '../hooks/useAppSelector.js';

export interface HeatmapGermanyState {
    staticPlotRendered: boolean;
}

const initialState: HeatmapGermanyState = {
    staticPlotRendered: false,
};

const heatmapGermanySlice = createSlice({
    name: 'heatmapGermany',
    initialState,
    reducers: {
        setStaticPlotRendered: (state, action: PayloadAction<boolean>) => {
            state.staticPlotRendered = action.payload;
        },
        resetStaticPlotRendered: (state) => {
            state.staticPlotRendered = false;
        }
    },
});

const isStaticPlotRendered = (state: RootState) => state.heatmapGermany.staticPlotRendered;
export const useIsStaticPlotRendered = (): boolean => {
    return useAppSelector(isStaticPlotRendered);
}

export const { setStaticPlotRendered, resetStaticPlotRendered } = heatmapGermanySlice.actions;
export default heatmapGermanySlice.reducer;