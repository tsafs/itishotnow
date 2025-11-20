import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { fetchYearlyMeanByDayData } from '../../services/YearlyMeanByDayService.js';
import { useMemo } from 'react';
import { useAppSelector } from '../hooks/useAppSelector.js';
import type { RootState } from '../index.js';
import type { YearlyMeanByDayByStationId } from '../../classes/YearlyMeanByDay.js';

export interface YearlyMeanByDayState {
    data: YearlyMeanByDayByStationId | null;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
    currentDay: { month: number; day: number } | null;
}

export interface FetchYearlyMeanByDayArgs {
    month: number;
    day: number;
}

const initialState: YearlyMeanByDayState = {
    data: null,
    status: 'idle',
    error: null,
    currentDay: null,
};

// Create async thunk for fetching historical data
export const fetchYearlyMeanByDay = createAsyncThunk<
    YearlyMeanByDayByStationId,
    FetchYearlyMeanByDayArgs,
    { rejectValue: string }
>(
    'yearlyMeanByDay/fetch',
    async ({ month, day }, { rejectWithValue }) => {
        try {
            return await fetchYearlyMeanByDayData(month, day);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch yearlyMeanByDay data';
            return rejectWithValue(message);
        }
    }
);

const yearlyMeanByDaySlice = createSlice({
    name: 'yearlyMeanByDay',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchYearlyMeanByDay.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchYearlyMeanByDay.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.data = action.payload;
                state.currentDay = action.meta.arg;
                state.error = null;
            })
            .addCase(fetchYearlyMeanByDay.rejected, (state, action) => {
                state.status = 'failed';
                state.error = typeof action.payload === 'string'
                    ? action.payload
                    : action.error?.message ?? 'Failed to fetch yearlyMeanByDay data';
            });
    },
});

// Selectors
export const selectYearlyMeanByDayData = (state: RootState): YearlyMeanByDayByStationId | null => state.yearlyMeanByDay.data;
export const selectYearlyMeanByDayStatus = (state: RootState) => state.yearlyMeanByDay.status;
export const selectYearlyMeanByDayError = (state: RootState) => state.yearlyMeanByDay.error;
export const selectYearlyMeanByDayDataForStation = (state: RootState, stationId: string | null | undefined) => {
    if (!stationId) {
        return null;
    }
    return state.yearlyMeanByDay.data?.[stationId] ?? null;
};

// Hooks
export const useYearlyMeanByDayData = (): YearlyMeanByDayByStationId | null => {
    const yearlyMeanByDay = useAppSelector(state => state.yearlyMeanByDay.data);
    const status = useAppSelector(state => state.yearlyMeanByDay.status);

    return useMemo(() => {
        if (status !== 'succeeded' || !yearlyMeanByDay) {
            return null;
        }
        return yearlyMeanByDay;
    }, [yearlyMeanByDay, status]);
};

export default yearlyMeanByDaySlice.reducer;
