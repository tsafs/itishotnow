import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { fetchLiveData as fetchLiveDataService } from '../../services/LiveDataService.js';
import { setStations } from './stationSlice.js';
import StationData from '../../classes/StationData.js';
import type { StationDataJSON } from '../../classes/StationData.js';
import type { RootState, AppDispatch } from '../index.js';
import type { StationJSON } from '../../classes/Station.js';

export interface LiveDataState {
    data: Record<string, StationDataJSON> | null;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: LiveDataState = {
    data: null,
    status: 'idle',
    error: null,
};

export const fetchLiveData = createAsyncThunk<
    Record<string, StationDataJSON>,
    void,
    { state: RootState; dispatch: AppDispatch; rejectValue: string }
>(
    'liveData/fetchData',
    async (_arg, { dispatch, rejectWithValue }) => {
        try {
            dispatch(setStations(null));
            const { stations, stationData } = await fetchLiveDataService();

            const serializedStations: Record<string, StationJSON> = {};
            for (const [id, station] of Object.entries(stations)) {
                serializedStations[id] = station.toJSON();
            }
            dispatch(setStations(serializedStations));

            const serializedData: Record<string, StationDataJSON> = {};
            for (const [id, data] of Object.entries(stationData)) {
                serializedData[id] = data.toJSON();
            }
            return serializedData;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch live data';
            return rejectWithValue(message);
        }
    }
);

const liveDataSlice = createSlice({
    name: 'liveData',
    initialState,
    reducers: {
        clearLiveData: (state) => {
            state.data = null;
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
                state.error = typeof action.payload === 'string'
                    ? action.payload
                    : action.error?.message ?? 'Failed to fetch live data';
            });
    },
});

export const { clearLiveData } = liveDataSlice.actions;

// Selectors
export const selectLiveData = createSelector(
    (state: RootState) => state.liveData.data,
    (data): Record<string, StationData> => {
        const result: Record<string, StationData> = {};
        if (!data) {
            return result;
        }
        for (const [stationId, stationData] of Object.entries(data)) {
            result[stationId] = StationData.fromJSON(stationData);
        }
        return result;
    }
);

export const selectLiveDataForStation = createSelector(
    [
        (state: RootState) => state.liveData.data,
        (_state: RootState, stationId: string | null | undefined) => stationId
    ],
    (data, stationId): StationData | null => {
        if (!data || !stationId) {
            return null;
        }
        return data[stationId] ? StationData.fromJSON(data[stationId]) : null;
    }
);

export const selectLiveDataStatus = (state: RootState) => state.liveData.status;
export const selectLiveDataError = (state: RootState) => state.liveData.error;

export default liveDataSlice.reducer;
