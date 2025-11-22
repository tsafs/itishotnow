import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { RootState } from '../index.js';
import { fetchGermanyGeoJSON } from '../../services/GeoJSONService.js';
import type { GermanyBoundaryGeoJSON } from '../../services/GeoJSONService.js';

export interface GeoJsonState {
    data: GermanyBoundaryGeoJSON | null;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: GeoJsonState = {
    data: null,
    status: 'idle',
    error: null,
};

export const fetchGeoJSON = createAsyncThunk('geoJson/fetch', async () => {
    const data = await fetchGermanyGeoJSON();
    return data;
});

const geoJsonSlice = createSlice({
    name: 'geoJson',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchGeoJSON.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchGeoJSON.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.data = action.payload;
            })
            .addCase(fetchGeoJSON.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message || 'Failed to fetch GeoJSON';
            });
    },
});

export const selectGeoJSONData = (state: RootState) => state.geoJson.data;
export const selectGeoJSONStatus = (state: RootState) => state.geoJson.status;

export default geoJsonSlice.reducer;
