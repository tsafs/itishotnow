import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchRollingAverageForStation } from '../../services/RollingAverageDataService.js';

export const fetchRollingAverageData = createAsyncThunk(
    'rollingAverageData/fetchData',
    async ({ stationId }, { rejectWithValue }) => {
        try {
            const data = await fetchRollingAverageForStation(stationId);
            return data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const rollingAverageDataSlice = createSlice({
    name: 'rollingAverageData',
    initialState: {
        data: [],
        status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
        error: null,
    },
    reducers: {
        clearRollingAverageData: (state) => {
            state.data = [];
            state.status = 'idle';
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchRollingAverageData.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchRollingAverageData.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.data = action.payload;
                state.error = null;
            })
            .addCase(fetchRollingAverageData.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || 'Failed to fetch rolling average data';
            });
    },
});

export const { clearRollingAverageData } = rollingAverageDataSlice.actions;

// Selectors
export const selectRollingAverageData = (state) => state.rollingAverageData.data;
export const selectRollingAverageDataStatus = (state) => state.rollingAverageData.status;
export const selectRollingAverageDataError = (state) => state.rollingAverageData.error;

export default rollingAverageDataSlice.reducer;
