import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchYearlyMeanByDayData } from '../../services/YearlyMeanByDayService.ts';
import { useSelector } from 'react-redux';
import { useMemo } from 'react';

// Create async thunk for fetching historical data
export const fetchYearlyMeanByDay = createAsyncThunk(
    'yearlyMeanByDay/fetch',
    async ({ month, day }, { rejectWithValue }) => {
        try {
            const data = await fetchYearlyMeanByDayData(month, day);
            return data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const yearlyMeanByDaySlice = createSlice({
    name: 'yearlyMeanByDay',
    initialState: {
        data: [],
        status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
        error: null,
        currentDay: {
            month: null,
            day: null
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchYearlyMeanByDay.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchYearlyMeanByDay.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.data = action.payload;
                state.currentDay = action.meta.arg; // Store the current day we have data for
                state.error = null;
            })
            .addCase(fetchYearlyMeanByDay.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || 'Failed to fetch yearlyMeanByDay data';
            });
    },
});

// Selectors
export const selectYearlyMeanByDayData = (state) => state.yearlyMeanByDay.data;
export const selectYearlyMeanByDayStatus = (state) => state.yearlyMeanByDay.status;
export const selectYearlyMeanByDayError = (state) => state.yearlyMeanByDay.error;
export const selectYearlyMeanByDayDataForStation = (state, stationId) => state.yearlyMeanByDay.data?.[stationId];

// Hooks
export const useYearlyMeanByDayData = () => {
    const yearlyMeanByDay = useSelector(state => state.yearlyMeanByDay.data);
    const status = useSelector(state => state.yearlyMeanByDay.status);

    return useMemo(() => {
        if (status !== 'succeeded') {
            return null;
        }
        if (!yearlyMeanByDay || yearlyMeanByDay.length === 0) {
            return null;
        }
        return yearlyMeanByDay;
    }, [yearlyMeanByDay, status]);
};

export default yearlyMeanByDaySlice.reducer;
