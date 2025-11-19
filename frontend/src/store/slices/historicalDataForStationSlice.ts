import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchDailyWeatherStationData } from '../../services/HistoricalDataForStationService.js';
import { useMemo } from 'react';
import { useAppSelector } from '../hooks/useAppSelector.js';
import type { IDateRange } from '../../classes/DateRange.js';
import type { RootState } from '../index.js';
import type { IStationDataByDate } from '../../classes/DailyRecentByStation.js';

export interface DailyDataForStationState {
    data: Record<string, IStationDataByDate>; // Keyed by stationId
    dateRange: Record<string, IDateRange>; // Keyed by stationId
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: DailyDataForStationState = {
    data: {},
    dateRange: {},
    status: 'idle',
    error: null,
};

// Arguments for thunk
export interface DailyDataForStationArgs {
    stationId: string;
}

// Payload for fulfilled thunk
export interface DailyDataForStationPayload {
    stationId: string;
    data: IStationDataByDate;
    dateRange: IDateRange;
}

export const fetchDailyDataForStation = createAsyncThunk<
    DailyDataForStationPayload, // Return type
    DailyDataForStationArgs,    // Argument type
    { state: RootState; rejectValue: string }
>(
    'historicalDailyData/fetchData',
    async ({ stationId }, { rejectWithValue, getState }) => {
        const state = getState();
        const existingData = state.historicalDailyData?.data?.[stationId];
        const existingDateRange = state.historicalDailyData?.dateRange?.[stationId];
        if (existingData && existingDateRange) {
            // Return the existing data in the same format as fulfilled payload
            return { stationId, data: existingData, dateRange: existingDateRange };
        }
        try {
            const { data, dateRange } = await fetchDailyWeatherStationData(stationId);
            return { stationId, data, dateRange };
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

const historicalDailyDataSlice = createSlice({
    name: 'historicalDailyData',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchDailyDataForStation.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchDailyDataForStation.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.error = null;
                const { stationId, data, dateRange } = action.payload;

                if (!state.data) {
                    state.data = {};
                }
                if (!state.dateRange) {
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
        return data[stationId] ? data[stationId] : null;
    }, [data, stationId]);
};

export const useHistoricalDailyDataDateRangeForStation = (stationId: string) => {
    const dateRanges = useAppSelector(state => state.historicalDailyData.dateRange);
    return dateRanges[stationId] ? dateRanges[stationId] : null;
};

export default historicalDailyDataSlice.reducer;
