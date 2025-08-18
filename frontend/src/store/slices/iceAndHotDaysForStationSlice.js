import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { fetchIceAndHotDaysForStation as fetchIceAndHotDaysForStationService } from '../../services/IceAndHotDaysForStationService';
import XYData from '../../classes/XYData';

export const fetchIceAndHotDaysForStation = createAsyncThunk(
    'iceAndHotDaysForStation/fetchData',
    async (stationId, { rejectWithValue, getState }) => {
        const state = getState();
        const existingData = state.iceAndHotDaysForStation?.data?.[stationId];
        if (existingData) {
            // Return the existing data in the same format as fulfilled payload
            return {
                stationId,
                daysBelow0Tmax: existingData.daysBelow0Tmax,
                daysAbove30Tmax: existingData.daysAbove30Tmax
            };
        }
        try {
            const { daysBelow0Tmax, daysAbove30Tmax } = await fetchIceAndHotDaysForStationService(stationId);

            // Serialize XYData objects to JSON
            return {
                stationId,
                daysBelow0Tmax: daysBelow0Tmax.toJSON(),
                daysAbove30Tmax: daysAbove30Tmax.toJSON()
            };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const iceAndHotDaysForStationSlice = createSlice({
    name: 'iceAndHotDaysForStation',
    initialState: {
        data: null,
        status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
        error: null,
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchIceAndHotDaysForStation.pending, (state) => {
                state.status = 'loading';
                state.data = null;
            })
            .addCase(fetchIceAndHotDaysForStation.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.error = null;
                const { stationId, daysBelow0Tmax, daysAbove30Tmax } = action.payload;
                if (!state.data) state.data = {};
                state.data[stationId] = {
                    daysBelow0Tmax,
                    daysAbove30Tmax
                };
            })
            .addCase(fetchIceAndHotDaysForStation.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || 'Failed to fetch ice and hot days data for station';
            });
    },
});

export const selectIceAndHotDaysForStationById = createSelector(
    [
        state => state.iceAndHotDaysForStation.data,
        (_, stationId) => stationId
    ],
    (data, stationId) => {
        if (!data?.[stationId]) return null;
        return {
            daysBelow0Tmax: XYData.fromJSON(data[stationId].daysBelow0Tmax),
            daysAbove30Tmax: XYData.fromJSON(data[stationId].daysAbove30Tmax)
        };
    }
);

export const selectIceAndHotDaysForStationStatus = (state) => state.iceAndHotDaysForStation.status;
export const selectIceAndHotDaysForStationError = (state) => state.iceAndHotDaysForStation.error;

export default iceAndHotDaysForStationSlice.reducer;
