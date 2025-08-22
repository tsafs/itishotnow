import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchDailyWeatherStationData } from '../../services/HistoricalDataForStationService.js';
import { useMemo } from 'react';
import { useAppSelector } from '../hooks/useAppSelector.js';
import type { RootState } from '../index.js';

export const fetchDailyDataForStation = createAsyncThunk(
    'historicalDailyData/fetchData',
    async ({ stationId }, { rejectWithValue, getState }) => {
        const state = getState();
        const existingData = state.historicalDailyData?.data?.[stationId];
        if (existingData) {
            // Return the existing data in the same format as fulfilled payload
            return { stationId, ...existingData };
        }
        try {
            const { data, dateRange } = await fetchDailyWeatherStationData(stationId);
            return { stationId, data, dateRange };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const historicalDailyDataSlice = createSlice({
    name: 'historicalDailyData',
    initialState: {
        data: null,
        dateRange: null,
        status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
        error: null,
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchDailyDataForStation.pending, (state) => {
                state.status = 'loading';
                state.data = null;
            })
            .addCase(fetchDailyDataForStation.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.error = null;
                const { stationId, data, dateRange } = action.payload;

                if (!state.data) {
                    state.data = {};
                    state.dateRange = {};
                }

                state.data[stationId] = data;
                state.dateRange[stationId] = dateRange;
            })
            .addCase(fetchDailyDataForStation.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || 'Failed to fetch historical data for station';
            });
    },
});

export const selectHistoricalDailyDataStatus = (state: RootState) => state.historicalDailyData.status;
export const selectHistoricalDailyDataError = (state: RootState) => state.historicalDailyData.error;

// Selector hooks
export const useHistoricalDailyDataForStation = (stationId: string) => {
    const data = useAppSelector(state => state.historicalDailyData.data);
    return useMemo(() => {
        return data?.[stationId] ? data[stationId] : null;
    }, [data, stationId]);
};

export const useHistoricalDailyDataDateRangeForStation = (stationId: string) => {
    const dateRanges = useAppSelector(state => state.historicalDailyData.dateRange);
    return dateRanges?.[stationId] ? dateRanges[stationId] : null;
};

export default historicalDailyDataSlice.reducer;
