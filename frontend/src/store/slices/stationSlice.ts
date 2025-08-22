import { createSlice, createSelector } from '@reduxjs/toolkit';

const stationsSlice = createSlice({
    name: 'stations',
    initialState: {
        stations: null,
    },
    reducers: {
        // Stores JSON serialized Station objects
        setStations: (state, action) => {
            if (action.payload === null) {
                state.stations = null;
                return;
            }
            state.stations = action.payload;
        },
    },
});

export const selectStationById = createSelector(
    [
        state => state.stations.stations,
        (state, id) => id
    ],
    (stations, id) => stations?.[id]
);

export const { setStations } = stationsSlice.actions;
export default stationsSlice.reducer;