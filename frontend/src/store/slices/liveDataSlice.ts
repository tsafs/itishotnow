import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { fetchLiveData as fetchLiveDataService } from '../../services/LiveDataService.js';
import { setStations } from './stationSlice.js';
import StationData from '../../classes/StationData.js';

export const fetchLiveData = createAsyncThunk(
    'liveData/fetchData',
    async (_, { dispatch, rejectWithValue }) => {
        try {
            dispatch(setStations(null));
            const { stations, stationData } = await fetchLiveDataService();

            const serializedStations = {};
            for (const [id, station] of Object.entries(stations)) {
                serializedStations[id] = station.toJSON();
            }
            dispatch(setStations(serializedStations));

            const serializedData = {};
            for (const [id, data] of Object.entries(stationData)) {
                serializedData[id] = data.toJSON();
            }
            return serializedData;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const liveDataSlice = createSlice({
    name: 'liveData',
    initialState: {
        data: null,
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
                state.data = null;
            })
            .addCase(fetchLiveData.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.error = null;
                state.data = action.payload;
            })
            .addCase(fetchLiveData.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || 'Failed to fetch live data';
            });
    },
});

export const { clearLiveData } = liveDataSlice.actions;

// Selectors
export const selectLiveData = createSelector(
    state => state.liveData.data,
    (data) => {
        const result = {};
        for (const [stationId, stationData] of Object.entries(data || {})) {
            result[stationId] = StationData.fromJSON(stationData);
        }
        return result;
    }
);

export const selectLiveDataForStation = createSelector(
    [
        state => state.liveData.data,
        (_, stationId) => stationId
    ],
    (data, stationId) => {
        return data?.[stationId] ? StationData.fromJSON(data[stationId]) : null;
    }
);

export const selectLiveDataStatus = (state) => state.liveData.status;
export const selectLiveDataError = (state) => state.liveData.error;

export default liveDataSlice.reducer;
