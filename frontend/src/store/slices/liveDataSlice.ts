import { createSelector } from '@reduxjs/toolkit';
import { fetchLiveData as fetchLiveDataService } from '../../services/LiveDataService.js';
import StationData from '../../classes/StationData.js';
import Station from '../../classes/Station.js';
import type { StationDataJSON } from '../../classes/StationData.js';
import type { RootState } from '../index.js';
import type { StationJSON } from '../../classes/Station.js';
import { createDataSlice } from '../factories/createDataSlice.js';

/**
 * Live data response containing both stations and their measurements
 */
export interface LiveDataResponse {
    stations: Record<string, StationJSON>;
    stationData: Record<string, StationDataJSON>;
}

/**
 * Create liveData slice using factory - includes both stations and measurements
 */
const { slice, actions, selectors } = createDataSlice<LiveDataResponse, void, 'simple'>({
    name: 'liveData',
    fetchFn: async () => {
        const { stations, stationData } = await fetchLiveDataService();

        return {
            stations: Object.fromEntries(
                Object.entries(stations).map(([id, station]) => [id, station.toJSON()])
            ),
            stationData: Object.fromEntries(
                Object.entries(stationData).map(([id, data]) => [id, data.toJSON()])
            )
        };
    },
    stateShape: 'simple',
    cache: {
        strategy: 'all',
        ttl: 60000 // 1 minute
    }
});

// Export actions
export const fetchLiveData = actions.fetch;
export const clearLiveData = actions.reset;

// Export status selectors from factory
export const selectLiveDataStatus = selectors.selectStatus;
export const selectLiveDataError = selectors.selectError;

// Selector for stations only
export const selectStations = createSelector(
    [(state: RootState) => selectors.selectData(state) as LiveDataResponse | undefined],
    (response): Record<string, Station> => {
        if (!response?.stations) return {};
        return Object.fromEntries(
            Object.entries(response.stations).map(([id, json]) => [id, Station.fromJSON(json)])
        );
    }
);

// Selector for station by ID
export const selectStationById = createSelector(
    [
        selectStations,
        (_state: RootState, id: string | null | undefined) => id
    ],
    (stations, id): Station | null => {
        if (!id) return null;
        return stations[id] ?? null;
    }
);

// Selector for live data (measurements) - returns StationData instances
export const selectLiveData = createSelector(
    [(state: RootState) => selectors.selectData(state) as LiveDataResponse | undefined],
    (response): Record<string, StationData> => {
        if (!response?.stationData) return {};
        return Object.fromEntries(
            Object.entries(response.stationData).map(([id, json]) => [id, StationData.fromJSON(json)])
        );
    }
);

// Selector for live data for specific station
export const selectLiveDataForStation = createSelector(
    [
        (state: RootState) => selectors.selectData(state) as LiveDataResponse | undefined,
        (_state: RootState, stationId: string | null | undefined) => stationId
    ],
    (response, stationId): StationData | null => {
        if (!response?.stationData || !stationId) return null;
        const json = response.stationData[stationId];
        return json ? StationData.fromJSON(json) : null;
    }
);

// Helper selector for raw stations JSON (used by cityDataSlice)
export const selectStationsJSON = (state: RootState): Record<string, StationJSON> | undefined => {
    const response = selectors.selectData(state) as LiveDataResponse | undefined;
    return response?.stations;
};

export default slice.reducer;
