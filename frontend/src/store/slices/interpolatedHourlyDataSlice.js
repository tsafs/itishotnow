import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchInterpolatedHourlyData } from '../../services/DataService';

/**
 * Async thunk to fetch interpolated hourly data for a specific day
 */
export const fetchHourlyData = createAsyncThunk(
    'interpolatedHourlyData/fetchData',
    async ({ month, day }, { rejectWithValue }) => {
        try {
            const data = await fetchInterpolatedHourlyData(month, day);
            return data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const interpolatedHourlyDataSlice = createSlice({
    name: 'interpolatedHourlyData',
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
        clearHourlyData: (state) => {
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
            .addCase(fetchHourlyData.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchHourlyData.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.data = action.payload;
                // Store the current day we have data for
                state.currentDay = action.meta.arg;
                state.error = null;
            })
            .addCase(fetchHourlyData.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || 'Failed to fetch interpolated hourly data';
            });
    },
});

export const { clearHourlyData } = interpolatedHourlyDataSlice.actions;

// Selectors
export const selectInterpolatedHourlyData = (state) => state.interpolatedHourlyData.data;
export const selectInterpolatedHourlyDataStatus = (state) => state.interpolatedHourlyData.status;
export const selectInterpolatedHourlyDataError = (state) => state.interpolatedHourlyData.error;

export default interpolatedHourlyDataSlice.reducer;
