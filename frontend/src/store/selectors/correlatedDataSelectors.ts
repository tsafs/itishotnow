import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../index.js';
import City from '../../classes/City.js';
import Station from '../../classes/Station.js';
import StationData from '../../classes/StationData.js';
import { DateTime } from 'luxon';
import { selectSelectedDate, selectCityDataStatus, selectIsToday } from './selectedItemSelectors.js';

/**
 * Granular selectors for correlated city-station-data across all cities.
 * These selectors provide efficient access to correlation data for heatmaps and lists.
 */

// ============================================================================
// Base selectors
// ============================================================================

const selectCitiesJSON = (state: RootState) => {
    return state.cityData.data;
};

const selectStationsJSON = (state: RootState) => {
    const liveDataResponse = state.liveData.data;
    return liveDataResponse?.stations;
};

const selectLiveStationDataJSON = (state: RootState) => {
    const liveDataResponse = state.liveData.data;
    return liveDataResponse?.stationData;
};

const selectDailyRecentByDate = (state: RootState) => {
    // The factory returns data directly for keyed state
    return state.dailyRecentByDate.data as Record<string, Record<string, any>> | undefined;
};

// ============================================================================
// Derived selectors
// ============================================================================

/**
 * Select all cities as City instances (memoized)
 */
const selectAllCities = createSelector(
    [selectCitiesJSON, selectCityDataStatus],
    (cities, status): Record<string, City> | null => {
        if (status !== 'succeeded' || !cities) return null;

        return Object.fromEntries(
            Object.entries(cities).map(([id, cityJSON]) => [id, City.fromJSON(cityJSON)])
        );
    }
);

/**
 * Select all stations as Station instances (memoized)
 */
const selectAllStations = createSelector(
    [selectStationsJSON, selectCityDataStatus],
    (stations, status): Record<string, Station> | null => {
        if (status !== 'succeeded' || !stations) return null;

        return Object.fromEntries(
            Object.entries(stations).map(([id, stationJSON]) => [id, Station.fromJSON(stationJSON)])
        );
    }
);

/**
 * Select city-station pairs (cities with their associated stations)
 * Returns array for iteration in components
 */
interface CityStationPair {
    cityId: string;
    city: City;
    station: Station;
}

const selectCityStationPairs = createSelector(
    [selectAllCities, selectAllStations],
    (cities, stations): CityStationPair[] | null => {
        if (!cities || !stations) return null;

        const pairs: CityStationPair[] = [];

        for (const [cityId, city] of Object.entries(cities)) {
            if (!city.stationId) continue;

            const station = stations[city.stationId];
            if (!station) continue;

            pairs.push({ cityId, city, station });
        }

        return pairs.length > 0 ? pairs : null;
    }
);

/**
 * Select station data for the currently selected date (all stations)
 * Handles both live data (today) and historical data (past dates)
 */
const selectAllStationDataForDate = createSelector(
    [
        selectSelectedDate,
        selectIsToday,
        selectLiveStationDataJSON,
        selectDailyRecentByDate,
        selectCityDataStatus,
    ],
    (selectedDate, isToday, liveData, dailyRecentByDate, status): Record<string, StationData> | null => {
        if (status !== 'succeeded') return null;

        const selectedDateLuxon = DateTime.fromISO(selectedDate);

        if (isToday) {
            // Use live data for today
            if (!liveData) return null;

            return Object.fromEntries(
                Object.entries(liveData).map(([stationId, dataJSON]) => [
                    stationId,
                    StationData.fromJSON(dataJSON as any)
                ])
            );
        } else {
            // Use daily recent data for past dates
            const dateKey = `${selectedDateLuxon.year}-${String(selectedDateLuxon.month).padStart(2, '0')}-${String(selectedDateLuxon.day).padStart(2, '0')}`;
            const dateData = dailyRecentByDate?.[dateKey];

            if (!dateData) return null;

            return Object.fromEntries(
                Object.entries(dateData).map(([stationId, data]) => [
                    stationId,
                    new StationData(
                        stationId,
                        selectedDateLuxon.toFormat('yyyyLLdd'),
                        (data as any).meanTemperature,
                        (data as any).minTemperature,
                        (data as any).maxTemperature,
                        (data as any).meanHumidity,
                    )
                ])
            );
        }
    }
);

/**
 * Complete correlated data: cities with their stations and data
 */
export interface CorrelatedStationDataEntry {
    city: City;
    station: Station;
    data: StationData;
}

export type CorrelatedStationDataMap = Record<string, CorrelatedStationDataEntry>;

export const selectCorrelatedData = createSelector(
    [selectCityStationPairs, selectAllStationDataForDate],
    (pairs, stationData): CorrelatedStationDataMap | null => {
        if (!pairs || !stationData) return null;

        const correlatedData: CorrelatedStationDataMap = {};

        for (const { cityId, city, station } of pairs) {
            const data = stationData[station.id];
            if (!data) continue;

            correlatedData[cityId] = { city, station, data };
        }

        return Object.keys(correlatedData).length > 0 ? correlatedData : null;
    }
);
