import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../index.js';
import City from '../../classes/City.js';
import Station from '../../classes/Station.js';
import StationData from '../../classes/StationData.js';
import { DateTime } from 'luxon';
import { getNow } from '../../utils/dateUtils.js';

/**
 * Granular selectors for selected item data.
 * Each selector returns a specific piece of data, allowing components to subscribe
 * only to what they need, improving performance and developer experience.
 */

// ============================================================================
// Base selectors (direct state access)
// ============================================================================

/**
 * Select the currently selected city ID
 */
export const selectSelectedCityId = (state: RootState): string | null => {
    return state.selectedCity.cityId;
};

/**
 * Select the selected date (ISO string)
 */
export const selectSelectedDate = (state: RootState): string => {
    return state.selectedDate;
};

/**
 * Select city data status
 */
export const selectCityDataStatus = (state: RootState) => {
    return state.cityData.status;
};

/**
 * Select all cities (JSON format)
 */
const selectCitiesJSON = (state: RootState) => {
    return state.cityData.data;
};

/**
 * Select all stations (JSON format)
 */
const selectStationsJSON = (state: RootState) => {
    const liveDataResponse = state.liveData.data;
    return liveDataResponse?.stations;
};

/**
 * Select live station data (JSON format)
 */
const selectLiveStationDataJSON = (state: RootState) => {
    const liveDataResponse = state.liveData.data;
    return liveDataResponse?.stationData;
};

/**
 * Select historical data for all stations
 */
const selectHistoricalDataByStation = (state: RootState) => {
    // The factory returns data directly for keyed state
    return state.historicalDailyData.data as Record<string, Record<string, any>> | undefined;
};

// ============================================================================
// Derived selectors (memoized computations)
// ============================================================================

/**
 * Select the station ID for the currently selected city
 */
export const selectSelectedStationId = createSelector(
    [selectSelectedCityId, selectCitiesJSON],
    (cityId, cities): string | null => {
        if (!cityId || !cities) return null;
        return cities[cityId]?.stationId ?? null;
    }
);

/**
 * Select the currently selected city as a City instance
 */
export const selectSelectedCity = createSelector(
    [selectSelectedCityId, selectCitiesJSON, selectCityDataStatus],
    (cityId, cities, status): City | null => {
        if (status !== 'succeeded' || !cityId || !cities) return null;
        const cityJSON = cities[cityId];
        if (!cityJSON) return null;
        return City.fromJSON(cityJSON);
    }
);

/**
 * Select the station for the currently selected city as a Station instance
 */
export const selectSelectedStation = createSelector(
    [selectSelectedStationId, selectStationsJSON, selectCityDataStatus],
    (stationId, stations, status): Station | null => {
        if (status !== 'succeeded' || !stationId || !stations) return null;
        const stationJSON = stations[stationId];
        if (!stationJSON) return null;
        return Station.fromJSON(stationJSON);
    }
);

/**
 * Select whether we're looking at today's data
 */
export const selectIsToday = createSelector(
    [selectSelectedDate],
    (selectedDate): boolean => {
        const selectedDateLuxon = DateTime.fromISO(selectedDate);
        return getNow().hasSame(selectedDateLuxon, 'day');
    }
);

/**
 * Select the station data for the currently selected station
 * Handles both live data (today) and historical data (past dates)
 */
export const selectSelectedStationData = createSelector(
    [
        selectSelectedStationId,
        selectSelectedDate,
        selectIsToday,
        selectLiveStationDataJSON,
        selectHistoricalDataByStation,
        selectCityDataStatus,
    ],
    (stationId, selectedDate, isToday, liveData, historicalData, status): StationData | null => {
        if (status !== 'succeeded' || !stationId) return null;

        if (isToday) {
            // Use live data for today
            const liveStationData = liveData?.[stationId];
            if (!liveStationData) return null;
            return StationData.fromJSON(liveStationData);
        } else {
            // Use historical data for past dates
            const stationHistoricalData = historicalData?.[stationId];
            if (!stationHistoricalData) return null;

            const selectedDateLuxon = DateTime.fromISO(selectedDate);
            const selectedDateYYYYMMDD = selectedDateLuxon.toFormat('yyyyLLdd');
            const matchingEntry = stationHistoricalData[selectedDateYYYYMMDD];

            if (!matchingEntry) return null;

            return new StationData(
                stationId,
                matchingEntry.date,
                matchingEntry.meanTemperature,
                matchingEntry.minTemperature,
                matchingEntry.maxTemperature,
                matchingEntry.meanHumidity,
            );
        }
    }
);

/**
 * Select the complete selected item (city, station, data)
 * This is a convenience selector that combines all three.
 */
export interface SelectedItem {
    city: City;
    station: Station;
    data: StationData;
}

export const selectSelectedItem = createSelector(
    [selectSelectedCity, selectSelectedStation, selectSelectedStationData],
    (city, station, data): SelectedItem | null => {
        if (!city || !station || !data) return null;
        return { city, station, data };
    }
);

/**
 * Returns just the selected city name (or null)
 */
export const selectSelectedCityName = createSelector(
    [selectSelectedCity],
    (city): string | null => city?.name ?? null
);

/**
 * Returns just the selected station name (or null)
 */
export const selectSelectedStationName = createSelector(
    [selectSelectedStation],
    (station): string | null => station?.name ?? null
);
