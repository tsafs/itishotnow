import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { useMemo } from 'react';
import { fetchReferenceYearlyHourlyInterpolatedByDayData } from '../../services/ReferenceYearlyHourlyInterpolatedByDayService.js';
import { useAppSelector } from '../hooks/useAppSelector.js';
import type { ReferenceYearlyHourlyInterpolatedByDayByStationId } from '../../classes/ReferenceYearlyHourlyInterpolatedByDay.js';

export interface ReferenceYearlyHourlyInterpolatedByDayState {
    data: ReferenceYearlyHourlyInterpolatedByDayByStationId | null;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
    currentDay: { month: number; day: number } | null;
}

export interface FetchReferenceYearlyHourlyInterpolatedByDayArgs {
    month: number;
    day: number;
}

const initialState: ReferenceYearlyHourlyInterpolatedByDayState = {
    data: null,
    status: 'idle',
    error: null,
    currentDay: null,
};

/**
 * Async thunk to fetch interpolated hourly data for a specific day
 */
export const fetchReferenceYearlyHourlyInterpolatedByDay = createAsyncThunk<
    ReferenceYearlyHourlyInterpolatedByDayByStationId,
    FetchReferenceYearlyHourlyInterpolatedByDayArgs,
    { rejectValue: string }
>(
    'referenceYearlyHourlyInterpolatedByDay/fetch',
    async ({ month, day }, { rejectWithValue }) => {
        try {
            return await fetchReferenceYearlyHourlyInterpolatedByDayData(month, day);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch interpolated hourly data';
            return rejectWithValue(message);
        }
    }
);

const referenceYearlyHourlyInterpolatedByDaySlice = createSlice({
    name: 'referenceYearlyHourlyInterpolatedByDay',
    initialState,
    reducers: {
        clearHourlyData: (state) => {
            state.data = null;
            state.status = 'idle';
            state.error = null;
            state.currentDay = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchReferenceYearlyHourlyInterpolatedByDay.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchReferenceYearlyHourlyInterpolatedByDay.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.data = action.payload;
                state.currentDay = action.meta.arg;
                state.error = null;
            })
            .addCase(fetchReferenceYearlyHourlyInterpolatedByDay.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload ?? 'Failed to fetch interpolated hourly data';
            });
    },
});

export const { clearHourlyData } = referenceYearlyHourlyInterpolatedByDaySlice.actions;

// Hooks
export const useReferenceYearlyHourlyInterpolatedByDayData = () => {
    const referenceYearlyHourlyInterpolatedByDay = useAppSelector(state => state.referenceYearlyHourlyInterpolatedByDay.data);
    const currentDay = useAppSelector(state => state.referenceYearlyHourlyInterpolatedByDay.currentDay);
    const status = useAppSelector(state => state.referenceYearlyHourlyInterpolatedByDay.status);

    return useMemo(() => {
        if (status !== 'succeeded' || !referenceYearlyHourlyInterpolatedByDay || !currentDay) {
            return null;
        }
        return { data: referenceYearlyHourlyInterpolatedByDay, month: currentDay.month, day: currentDay.day };
    }, [referenceYearlyHourlyInterpolatedByDay, currentDay, status]);
};

export default referenceYearlyHourlyInterpolatedByDaySlice.reducer;
