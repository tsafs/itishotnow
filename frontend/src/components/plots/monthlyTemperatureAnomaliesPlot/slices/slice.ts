import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../../../store';
import { useAppSelector } from '../../../../store/hooks/useAppSelector';

export type TState = {
    renderComplete: boolean;
}

const initialState: TState = {
    renderComplete: false,
};

const slice = createSlice({
    name: 'monthlyTemperatureAnomalies',
    initialState,
    reducers: {
        setRenderComplete(state, action: PayloadAction<boolean>) {
            state.renderComplete = action.payload;
        },
        resetRenderComplete(state) {
            state.renderComplete = false;
        }
    }
});

export const selectRenderComplete = (state: RootState) =>
    state.monthlyTemperatureAnomalies.renderComplete;

export const useRenderComplete = (): boolean =>
    useAppSelector(selectRenderComplete);

export const {
    setRenderComplete,
    resetRenderComplete
} = slice.actions;

export default slice.reducer;
