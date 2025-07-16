import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchLiveData as fetchLiveDataService } from '../../services/LiveDataService';

export const fetchLiveData = createAsyncThunk(
    'liveData/fetchData',
    async (_, { rejectWithValue }) => {
        try {
            const data = await fetchLiveDataService();
            return data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const liveDataSlice = createSlice({
    name: 'liveData',
    initialState: {
        data: [],
        status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
        error: null,
    },
    reducers: {
        clearLiveData: (state) => {
            state.data = [];
            state.status = 'idle';
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchLiveData.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchLiveData.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.data = action.payload;
                state.error = null;
            })
            .addCase(fetchLiveData.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || 'Failed to fetch live data';
            });
    },
});

export const { clearLiveData } = liveDataSlice.actions;

// Selectors
export const selectLiveData = (state) => state.liveData.data;
export const selectLiveDataStatus = (state) => state.liveData.status;
export const selectLiveDataError = (state) => state.liveData.error;
export const selectLiveDataForStation = (state, stationId) => state.liveData.data?.[stationId];

export default liveDataSlice.reducer;
