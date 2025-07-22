import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchHistoricalDataForDay } from '../../services/DataService';
import { useSelector } from 'react-redux';
import { useMemo } from 'react';

// Create async thunk for fetching historical data
export const fetchHistoricalData = createAsyncThunk(
    'historicalData/fetchData',
    async ({ month, day }, { rejectWithValue }) => {
        console.log(`Fetching historical data for ${month}/${day}`);
        try {
            const data = await fetchHistoricalDataForDay(month, day);
            return data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const historicalDataSlice = createSlice({
    name: 'historicalData',
    initialState: {
        data: [],
        status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
        error: null,
        currentDay: {
            month: null,
            day: null
        },
    },
    reducers: {
        clearHistoricalData: (state) => {
            state.data = [];
            state.status = 'idle';
            state.error = null;
            state.currentDay = {
                month: null,
                day: null
            };
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchHistoricalData.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchHistoricalData.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.data = action.payload;
                state.currentDay = action.meta.arg; // Store the current day we have data for
                state.error = null;
            })
            .addCase(fetchHistoricalData.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || 'Failed to fetch historical data';
            });
    },
});

export const { clearHistoricalData } = historicalDataSlice.actions;

// Selectors
export const selectHistoricalData = (state) => state.historicalData.data;
export const selectHistoricalDataStatus = (state) => state.historicalData.status;
export const selectHistoricalDataError = (state) => state.historicalData.error;
export const selectHistoricalDataForStation = (state, stationId) => state.historicalData.data?.[stationId];

export const useHistoricalData = (month, day) => {
    const historicalData = useSelector(state => state.historicalData);
    return useMemo(() => {
        if (!historicalData.data) return null;
        if (historicalData.currentDay.month !== month || historicalData.currentDay.day !== day) {
            return null; // No data for the requested month and day
        }
        return historicalData.data;
    }, [historicalData, month, day]);
};

export default historicalDataSlice.reducer;
