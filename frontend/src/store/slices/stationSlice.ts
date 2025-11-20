import { createSlice, createSelector } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index.js';
import type { StationJSON } from '../../classes/Station.js';

export interface StationsState {
    stations: Record<string, StationJSON> | null;
}

const initialState: StationsState = {
    stations: null,
};

const stationsSlice = createSlice({
    name: 'stations',
    initialState,
    reducers: {
        // Stores JSON serialized Station objects
        setStations: (state, action: PayloadAction<Record<string, StationJSON> | null>) => {
            state.stations = action.payload;
        },
    },
});

export const selectStations = (state: RootState) => state.stations.stations;

export const selectStationById = createSelector(
    [
        selectStations,
        (_state: RootState, id: string | null | undefined) => id
    ],
    (stations, id): StationJSON | null => {
        if (!stations || !id) {
            return null;
        }
        return stations[id] ?? null;
    }
);

export const { setStations } = stationsSlice.actions;
export default stationsSlice.reducer;