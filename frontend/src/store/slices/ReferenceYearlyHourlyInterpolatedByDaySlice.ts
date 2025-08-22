import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { useMemo } from 'react';
import { fetchReferenceYearlyHourlyInterpolatedByDayData } from '../../services/ReferenceYearlyHourlyInterpolatedByDayService.js';
import { useAppSelector } from '../hooks/useAppSelector.js';

/**
 * Async thunk to fetch interpolated hourly data for a specific day
 */
export const fetchReferenceYearlyHourlyInterpolatedByDay = createAsyncThunk(
    'referenceYearlyHourlyInterpolatedByDay/fetch',
    async ({ month, day }, { rejectWithValue }) => {
        try {
            const data = await fetchReferenceYearlyHourlyInterpolatedByDayData(month, day);
            return data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const referenceYearlyHourlyInterpolatedByDaySlice = createSlice({
    name: 'referenceYearlyHourlyInterpolatedByDay',
    initialState: {
        data: null,
        status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
        error: null,
        currentDay: {
            month: null,
            day: null
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
                // Store the current day we have data for
                state.currentDay = action.meta.arg;
                state.error = null;
            })
            .addCase(fetchReferenceYearlyHourlyInterpolatedByDay.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || 'Failed to fetch interpolated hourly data';
            });
    },
});

export const { clearHourlyData } = referenceYearlyHourlyInterpolatedByDaySlice.actions;

// Hooks
export const useReferenceYearlyHourlyInterpolatedByDayData = () => {
    const referenceYearlyHourlyInterpolatedByDay = useAppSelector(state => state.referenceYearlyHourlyInterpolatedByDay.data);
    const { month: currentMonth, day: currentDay } = useAppSelector(state => state.referenceYearlyHourlyInterpolatedByDay.currentDay);
    const status = useAppSelector(state => state.referenceYearlyHourlyInterpolatedByDay.status);

    return useMemo(() => {
        if (status !== 'succeeded') {
            return null;
        }
        if (!referenceYearlyHourlyInterpolatedByDay || referenceYearlyHourlyInterpolatedByDay.length === 0) {
            return null;
        }
        return { data: referenceYearlyHourlyInterpolatedByDay, month: currentMonth, day: currentDay };
    }, [referenceYearlyHourlyInterpolatedByDay, currentDay, currentMonth, status]);
};

export default referenceYearlyHourlyInterpolatedByDaySlice.reducer;
