import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchDailyWeatherStationData } from '../../services/HistoricalDataForStationService';
import { useSelector } from 'react-redux';
import { useMemo } from 'react';

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
                }

                state.data[stationId] = { data, dateRange };
            })
            .addCase(fetchDailyDataForStation.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || 'Failed to fetch historical data for station';
            });
    },
});

export const selectHistoricalDailyDataStatus = (state) => state.historicalDailyData.status;
export const selectHistoricalDailyDataError = (state) => state.historicalDailyData.error;

// Selector hooks
export const useHistoricalDailyDataForStation = (stationId) => {
    const data = useSelector(state => state.historicalDailyData.data);
    return useMemo(() => {
        return data?.[stationId] ? data[stationId].data : null;
    }, [data, stationId]);
};

export const useHistoricalDailyDataDateRangeForStation = (stationId) => {
    const data = useSelector(state => state.historicalDailyData.data);
    return useMemo(() => {
        return data?.[stationId] ? data[stationId].dateRange : null;
    }, [data, stationId]);
};

export default historicalDailyDataSlice.reducer;
