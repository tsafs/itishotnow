import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { fetchRollingAverageForStation } from '../../services/RollingAverageDataService.js';
import type { RootState } from '../index.js';
import type { RollingAverageRecordList } from '../../classes/RollingAverageRecord.js';

export interface RollingAverageDataState {
    data: RollingAverageRecordList;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: RollingAverageDataState = {
    data: [],
    status: 'idle',
    error: null,
};

export const fetchRollingAverageData = createAsyncThunk<
    RollingAverageRecordList,
    { stationId: string },
    { rejectValue: string }
>(
    'rollingAverageData/fetchData',
    async ({ stationId }, { rejectWithValue }) => {
        try {
            return await fetchRollingAverageForStation(stationId);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch rolling average data';
            return rejectWithValue(message);
        }
    }
);

const rollingAverageDataSlice = createSlice({
    name: 'rollingAverageData',
    initialState,
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
                state.error = typeof action.payload === 'string'
                    ? action.payload
                    : action.error?.message ?? 'Failed to fetch rolling average data';
            });
    },
});

export const { clearRollingAverageData } = rollingAverageDataSlice.actions;

// Selectors
export const selectRollingAverageData = (state: RootState): RollingAverageRecordList => state.rollingAverageData.data;
export const selectRollingAverageDataStatus = (state: RootState) => state.rollingAverageData.status;
export const selectRollingAverageDataError = (state: RootState) => state.rollingAverageData.error;

export default rollingAverageDataSlice.reducer;
