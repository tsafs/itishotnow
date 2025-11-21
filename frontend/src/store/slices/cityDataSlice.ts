import { createSelector } from '@reduxjs/toolkit';
import { fetchGermanCities, findClosestWeatherStationsForCities } from '../../services/CityService.js';
import City, { type CityJSON } from '../../classes/City.js';
import Station, { type StationJSON } from '../../classes/Station.js';
import type { RootState } from '../index.js';
import { createDataSlice } from '../factories/createDataSlice.js';

/**
 * Fetch arguments - requires stations to correlate cities
 */
export interface FetchCityDataArgs {
    stations: Record<string, StationJSON>;
}

/**
 * Fetch function that correlates cities with stations
 */
const fetchCityDataFn = async ({ stations: stationsJSON }: FetchCityDataArgs): Promise<Record<string, CityJSON>> => {
    const cities = await fetchGermanCities();
    const citiesDict = Object.fromEntries(cities.map(c => [c.id, c]));

    // Convert StationJSON to Station instances for correlation
    const stations = Object.fromEntries(
        Object.entries(stationsJSON).map(([id, json]) => [id, Station.fromJSON(json)])
    );

    // Correlate cities with stations immediately
    const correlatedCities = findClosestWeatherStationsForCities(citiesDict, stations);

    // Return as JSON
    return Object.fromEntries(
        Object.entries(correlatedCities).map(([id, city]) => [id, city.toJSON()])
    );
};

/**
 * Create cityData slice using factory
 * Cities are always correlated with stations by construction
 */
const { slice, actions, selectors } = createDataSlice<
    Record<string, CityJSON>,
    FetchCityDataArgs,
    'simple'
>({
    name: 'cityData',
    fetchFn: fetchCityDataFn,
    stateShape: 'simple',
    cache: { strategy: 'all' }, // Cache all cities once loaded
});

// Export actions
export const fetchCityData = actions.fetch;

// Export status selectors
export const selectCityDataStatus = selectors.selectStatus;
export const selectCityDataError = selectors.selectError;

// Custom selector to convert CityJSON to City instances
export const selectCities = createSelector(
    [(state: RootState) => selectors.selectData(state) as Record<string, CityJSON> | undefined],
    (data): Record<string, City> => {
        if (!data) return {};
        const result: Record<string, City> = {};
        for (const [id, json] of Object.entries(data)) {
            result[id] = City.fromJSON(json);
        }
        return result;
    }
);

export default slice.reducer;