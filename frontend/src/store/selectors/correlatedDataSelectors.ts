import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../index.js';
import City from '../../classes/City.js';
import Station from '../../classes/Station.js';
import StationData from '../../classes/StationData.js';
import { DateTime } from 'luxon';
import { selectSelectedDate, selectCityDataStatus, selectIsToday } from './selectedItemSelectors.js';
import type { YearlyMeanByDayByStationId } from '../../classes/YearlyMeanByDay.js';
import type { ReferenceYearlyHourlyInterpolatedByDayByStationId } from '../../classes/ReferenceYearlyHourlyInterpolatedByDay.js';

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

// Cache for StationData instances to avoid recreating on every date change
const stationDataCache = new Map<string, StationData>();

const selectYearlyMeanByDayData = (state: RootState) => state.yearlyMeanByDay.data as YearlyMeanByDayByStationId | undefined;
const selectYearlyMeanByDayStatus = (state: RootState) => state.yearlyMeanByDay.status;
const selectReferenceHourlyData = (state: RootState) => state.referenceYearlyHourlyInterpolatedByDay.data as ReferenceYearlyHourlyInterpolatedByDayByStationId | undefined;
const selectReferenceHourlyDataStatus = (state: RootState) => state.referenceYearlyHourlyInterpolatedByDay.status;
const selectReferenceHourlyContext = (state: RootState) => (state.referenceYearlyHourlyInterpolatedByDay as any).context;

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
            if (!liveData) return null;
            const result: Record<string, StationData> = {};
            for (const [stationId, dataJSON] of Object.entries(liveData)) {
                const dateStr = (dataJSON as any).date || selectedDateLuxon.toFormat('yyyyLLdd');
                const cacheKey = `${stationId}|${dateStr}|live`;
                let sd = stationDataCache.get(cacheKey);
                if (!sd) {
                    sd = StationData.fromJSON(dataJSON as any);
                    stationDataCache.set(cacheKey, sd);
                }
                result[stationId] = sd;
            }
            return result;
        } else {
            const dateKey = `${selectedDateLuxon.year}-${String(selectedDateLuxon.month).padStart(2, '0')}-${String(selectedDateLuxon.day).padStart(2, '0')}`;
            const dateData = dailyRecentByDate?.[dateKey];
            if (!dateData) return null;
            const result: Record<string, StationData> = {};
            for (const [stationId, data] of Object.entries(dateData)) {
                const dateStr = selectedDateLuxon.toFormat('yyyyLLdd');
                const cacheKey = `${stationId}|${dateStr}|hist`;
                let sd = stationDataCache.get(cacheKey);
                if (!sd) {
                    sd = new StationData(
                        stationId,
                        dateStr,
                        (data as any).meanTemperature,
                        (data as any).minTemperature,
                        (data as any).maxTemperature,
                        (data as any).meanHumidity,
                    );
                    stationDataCache.set(cacheKey, sd);
                }
                result[stationId] = sd;
            }
            return result;
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

// ============================================================================
// Enhanced selectors with precomputed anomalies for performance
// ============================================================================

/**
 * Plot data with precomputed anomalies
 */
export interface PlotDatum {
    cityId: string;
    cityName: string;
    cityLat: number;
    cityLon: number;
    stationId: string;
    stationLat: number;
    stationLon: number;
    date: string;
    temperature: number | null;
    rawTemperature: number | null;
    rawMaxTemperature: number | null;
    anomaly: number | null;
}

// Cache for parsed dates to avoid repeated parsing
const dateParseCache = new Map<string, DateTime>();

const parseDateCached = (dateString: string): DateTime => {
    let parsed = dateParseCache.get(dateString);
    if (!parsed) {
        parsed = DateTime.fromFormat(dateString, 'dd.MM.yyyy HH:mm', { zone: 'Europe/Berlin' });
        dateParseCache.set(dateString, parsed);
    }
    return parsed;
};

/**
 * Precompute plot data with anomalies in the selector layer
 * This avoids expensive computation in components
 */
export const selectPlotDataWithAnomalies = createSelector(
    [
        selectCorrelatedData,
        selectIsToday,
        selectSelectedDate,
        selectYearlyMeanByDayData,
        selectYearlyMeanByDayStatus,
        selectReferenceHourlyData,
        selectReferenceHourlyDataStatus,
        selectReferenceHourlyContext,
    ],
    (
        correlatedData,
        isToday,
        selectedDate,
        yearlyMeanByDayData,
        yearlyMeanStatus,
        referenceHourlyData,
        referenceHourlyStatus,
        referenceHourlyContext
    ): PlotDatum[] | null => {
        // Stable identity cache across recomputations
        const staticGlobal: any = (selectPlotDataWithAnomalies as any);
        if (!staticGlobal._cache) {
            staticGlobal._lastKey = null;
            staticGlobal._cache = null;
        }

        if (!correlatedData) return staticGlobal._cache;

        const selectedDateLuxon = DateTime.fromISO(selectedDate);
        const readinessKeyParts = [
            selectedDateLuxon.toISODate(),
            isToday ? 'T' : 'H',
            yearlyMeanStatus,
            referenceHourlyStatus,
        ];
        const key = readinessKeyParts.join('|');

        // If data not fully ready, return previous cache to avoid new identity
        const needsHourly = isToday;
        const hourlyReady = !needsHourly || (referenceHourlyStatus === 'succeeded' && referenceHourlyData && referenceHourlyContext && referenceHourlyContext.month === selectedDateLuxon.month && referenceHourlyContext.day === selectedDateLuxon.day);
        const dailyReady = !isToday || (yearlyMeanStatus === 'succeeded' && yearlyMeanByDayData);
        const fullyReady = hourlyReady && dailyReady;

        if (!fullyReady) {
            return staticGlobal._cache; // keep previous result
        }

        // If same key and we have cache, reuse it
        if (staticGlobal._lastKey === key && staticGlobal._cache) {
            return staticGlobal._cache;
        }

        if (import.meta.env.MODE === 'development') {
            console.time('plotData-build');
        }

        const plotData: PlotDatum[] = Object.values(correlatedData).map(({ city, station, data }) => ({
            cityId: city.id,
            cityName: city.name,
            cityLat: city.lat,
            cityLon: city.lon,
            stationId: station.id,
            stationLat: station.lat,
            stationLon: station.lon,
            date: data.date,
            temperature: isToday ? (data.temperature ?? null) : (data.maxTemperature ?? null),
            rawTemperature: data.temperature ?? null,
            rawMaxTemperature: data.maxTemperature ?? null,
            anomaly: null,
        }));

        if (isToday) {
            for (const entry of plotData) {
                const stationData = referenceHourlyData![entry.stationId];
                if (!stationData) continue;
                const parsedDate = parseDateCached(entry.date);
                if (!parsedDate.isValid) continue;
                const hourKey = `hour_${parsedDate.hour}` as const;
                const referenceValue = stationData[hourKey];
                if (typeof entry.temperature === 'number' && typeof referenceValue === 'number') {
                    entry.anomaly = entry.temperature - referenceValue;
                }
            }
        } else {
            for (const entry of plotData) {
                const reference = yearlyMeanByDayData![entry.stationId]?.tasmax;
                if (typeof entry.temperature === 'number' && typeof reference === 'number') {
                    entry.anomaly = entry.temperature - reference;
                }
            }
        }

        staticGlobal._lastKey = key;
        staticGlobal._cache = plotData;

        if (import.meta.env.MODE === 'development') {
            console.timeEnd('plotData-build');
        }

        return plotData;
    }
);
