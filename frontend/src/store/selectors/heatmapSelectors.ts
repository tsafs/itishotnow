import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../index.js';
import { DateTime } from 'luxon';
import { selectSelectedDate, selectIsToday, selectCityDataStatus } from './selectedItemSelectors.js';
import { PREDEFINED_CITIES } from '../../constants/map.js';

/**
 * Stage 1 heatmap refactor selectors.
 * These provide a flattened, responsibility-isolated pipeline:
 * 1. Correlated points (city + station + stationData basics)
 * 2. Plot base data (no anomalies) with stable structural sharing
 */

// ---------------------------------------------
// Local cache helpers
// ---------------------------------------------
interface StationDataLite {
    stationId: string;
    date: string;
    temperature: number | null;
    maxTemperature: number | null;
}

interface CorrelatedPoint {
    cityId: string;
    cityName: string;
    stationId: string;
    cityLat: number;
    cityLon: number;
    stationLat: number;
    stationLon: number;
    date: string;
    temperature: number | null; // mean / live temperature
    maxTemperature: number | null; // max temp (historical tasmax)
}

export interface PlotBaseDatum {
    cityId: string;
    cityName: string;
    stationId: string;
    cityLat: number;
    cityLon: number;
    stationLat: number;
    stationLon: number;
    date: string;
    temperature: number | null; // chosen display temperature (today: current/live; historical: max)
    rawTemperature: number | null; // original mean/live value
    rawMaxTemperature: number | null; // original max value
    anomaly: null; // placeholder for later enrichment stage
}

export interface PlotDatum extends Omit<PlotBaseDatum, 'anomaly'> {
    anomaly: number | null;
}

// ---------------------------------------------
// Primitive selectors
// ---------------------------------------------
const selectCitiesJSON = (state: RootState) => state.cityData.data;
const selectLiveStationsJSON = (state: RootState) => state.liveData.data?.stations;
const selectLiveStationDataJSON = (state: RootState) => state.liveData.data?.stationData;
const selectDailyRecentByDate = (state: RootState) => state.dailyRecentByDate.data as Record<string, Record<string, any>> | undefined;
// Yearly mean (historical reference)
const selectYearlyMeanByDayData = (state: RootState) => state.yearlyMeanByDay.data as Record<string, any> | undefined;
const selectYearlyMeanByDayStatus = (state: RootState) => state.yearlyMeanByDay.status;
// Hourly reference (today reference)
const selectReferenceHourlyData = (state: RootState) => state.referenceYearlyHourlyInterpolatedByDay.data as Record<string, any> | undefined;
const selectReferenceHourlyDataStatus = (state: RootState) => state.referenceYearlyHourlyInterpolatedByDay.status;
const selectReferenceHourlyContext = (state: RootState) => (state.referenceYearlyHourlyInterpolatedByDay as any).context;

// ---------------------------------------------
// Correlated points (flattened)
// ---------------------------------------------
export const selectCorrelatedPoints = createSelector(
    [
        selectCitiesJSON,
        selectLiveStationsJSON,
        selectLiveStationDataJSON,
        selectDailyRecentByDate,
        selectSelectedDate,
        selectIsToday,
        selectCityDataStatus,
    ],
    (cities, stations, liveStationData, dailyRecentByDate, selectedDate, isToday, cityStatus): CorrelatedPoint[] | null => {
        if (cityStatus !== 'succeeded' || !cities) return null;

        const selectedDateLuxon = DateTime.fromISO(selectedDate);
        const result: CorrelatedPoint[] = [];

        // Build station data lookup (lite) depending on mode
        const stationDataLite: Record<string, StationDataLite> = {};

        if (isToday) {
            if (!liveStationData || !stations) return null;
            for (const [stationId, dataJSON] of Object.entries(liveStationData)) {
                const dateStr = (dataJSON as any).date || selectedDateLuxon.toFormat('yyyyLLdd');
                stationDataLite[stationId] = {
                    stationId,
                    date: dateStr,
                    temperature: (dataJSON as any).temperature ?? null,
                    maxTemperature: (dataJSON as any).maxTemperature ?? null,
                };
            }
        } else {
            const dateKey = `${selectedDateLuxon.year}-${String(selectedDateLuxon.month).padStart(2, '0')}-${String(selectedDateLuxon.day).padStart(2, '0')}`;
            const dateData = dailyRecentByDate?.[dateKey];
            if (!dateData) return null;
            for (const [stationId, data] of Object.entries(dateData)) {
                const dateStr = selectedDateLuxon.toFormat('yyyyLLdd');
                stationDataLite[stationId] = {
                    stationId,
                    date: dateStr,
                    temperature: (data as any).meanTemperature ?? null,
                    maxTemperature: (data as any).maxTemperature ?? null,
                };
            }
        }

        for (const [cityId, cityJSON] of Object.entries(cities)) {
            const stationId = (cityJSON as any).stationId;
            if (!stationId) continue;

            const stationJSON = stations?.[stationId];
            if (!stationJSON) continue;

            const dataLite = stationDataLite[stationId];
            if (!dataLite) continue; // station data not ready yet

            result.push({
                cityId,
                cityName: (cityJSON as any).name,
                stationId,
                cityLat: (cityJSON as any).lat,
                cityLon: (cityJSON as any).lon,
                stationLat: (stationJSON as any).lat,
                stationLon: (stationJSON as any).lon,
                date: dataLite.date,
                temperature: dataLite.temperature,
                maxTemperature: dataLite.maxTemperature,
            });
        }

        return result.length ? result : null;
    }
);

// ---------------------------------------------
// Plot base data (no anomalies) + structural sharing
// ---------------------------------------------
export const selectPlotBaseData = createSelector(
    [selectCorrelatedPoints, selectIsToday],
    (points, isToday): PlotBaseDatum[] | null => {
        // Closure-based cache on selector function
        const self: any = selectPlotBaseData as any;
        if (!self._cache) {
            self._cache = null;
            self._lastKey = null;
        }

        if (!points) return self._cache;

        const key = `${isToday ? 'T' : 'H'}|${points.length}`;
        if (self._lastKey === key && self._cache) {
            return self._cache;
        }

        if (import.meta.env.MODE === 'development') {
            console.time('plotBaseData-build');
        }

        const data: PlotBaseDatum[] = points.map(p => {
            const displayTemp = isToday ? p.temperature : p.maxTemperature;
            return {
                cityId: p.cityId,
                cityName: p.cityName,
                stationId: p.stationId,
                cityLat: p.cityLat,
                cityLon: p.cityLon,
                stationLat: p.stationLat,
                stationLon: p.stationLon,
                date: p.date,
                temperature: typeof displayTemp === 'number' ? displayTemp : null,
                rawTemperature: p.temperature,
                rawMaxTemperature: p.maxTemperature,
                anomaly: null,
            };
        });

        self._lastKey = key;
        self._cache = data;

        if (import.meta.env.MODE === 'development') {
            console.timeEnd('plotBaseData-build');
        }

        return data;
    }
);

// ---------------------------------------------
// Anomaly selectors (today & historical separate)
// ---------------------------------------------

// Today anomalies: live temperature vs hourly reference
export const selectPlotAnomaliesToday = createSelector(
    [
        selectPlotBaseData,
        selectIsToday,
        selectSelectedDate,
        selectReferenceHourlyData,
        selectReferenceHourlyDataStatus,
        selectReferenceHourlyContext,
    ],
    (
        baseData,
        isToday,
        selectedDate,
        hourlyData,
        hourlyStatus,
        hourlyContext
    ): Record<string, number> | null => {
        const self: any = selectPlotAnomaliesToday as any;
        if (!self._cache) {
            self._cache = null;
            self._lastKey = null;
        }
        if (!isToday) return null;
        if (!baseData) return self._cache;
        const selectedDateLuxon = DateTime.fromISO(selectedDate);
        const hourlyReady = hourlyStatus === 'succeeded' && hourlyData && hourlyContext && hourlyContext.month === selectedDateLuxon.month && hourlyContext.day === selectedDateLuxon.day;
        const key = `T|${hourlyStatus}|${hourlyContext?.month}-${hourlyContext?.day}|${baseData.length}`;
        if (!hourlyReady) return self._cache; // keep previous until ready
        if (self._lastKey === key && self._cache) return self._cache;

        if (import.meta.env.MODE === 'development') {
            console.time('plotAnomaliesToday-build');
        }
        const map: Record<string, number> = {};
        for (const d of baseData) {
            if (typeof d.rawTemperature !== 'number') continue;
            // date format assumed 'dd.MM.yyyy HH:mm'
            const hourStr = d.date.length >= 13 ? d.date.slice(11, 13) : '';
            const hour = Number.parseInt(hourStr, 10);
            if (Number.isNaN(hour)) continue;
            const ref = hourlyData![d.stationId]?.[`hour_${hour}`];
            if (typeof ref === 'number') {
                map[d.stationId] = d.rawTemperature - ref;
            }
        }
        self._lastKey = key;
        self._cache = map;
        if (import.meta.env.MODE === 'development') {
            console.timeEnd('plotAnomaliesToday-build');
        }
        return map;
    }
);

// Historical anomalies: max temperature vs yearly mean tasmax
export const selectPlotAnomaliesHistorical = createSelector(
    [
        selectPlotBaseData,
        selectIsToday,
        selectYearlyMeanByDayData,
        selectYearlyMeanByDayStatus,
        selectSelectedDate,
    ],
    (
        baseData,
        isToday,
        yearlyMeanData,
        yearlyMeanStatus,
        selectedDate
    ): Record<string, number> | null => {
        const self: any = selectPlotAnomaliesHistorical as any;
        if (!self._cache) {
            self._cache = null;
            self._lastKey = null;
        }
        if (isToday) return null;
        if (!baseData) return self._cache;
        const ready = yearlyMeanStatus === 'succeeded' && yearlyMeanData;
        const key = `H|${yearlyMeanStatus}|${selectedDate}|${baseData.length}`;
        if (!ready) return self._cache;
        if (self._lastKey === key && self._cache) return self._cache;
        if (import.meta.env.MODE === 'development') {
            console.time('plotAnomaliesHistorical-build');
        }
        const map: Record<string, number> = {};
        for (const d of baseData) {
            if (typeof d.temperature !== 'number') continue;
            const ref = yearlyMeanData![d.stationId]?.tasmax;
            if (typeof ref === 'number') {
                map[d.stationId] = d.temperature - ref;
            }
        }
        self._lastKey = key;
        self._cache = map;
        if (import.meta.env.MODE === 'development') {
            console.timeEnd('plotAnomaliesHistorical-build');
        }
        return map;
    }
);

// ---------------------------------------------
// Final plot data merge (base + anomalies) with structural sharing
// ---------------------------------------------
export const selectPlotData = createSelector(
    [
        selectPlotBaseData,
        selectPlotAnomaliesToday,
        selectPlotAnomaliesHistorical,
        selectIsToday,
    ],
    (
        baseData,
        anomaliesToday,
        anomaliesHistorical,
        isToday
    ): PlotDatum[] | null => {
        const self: any = selectPlotData as any;
        if (!self._cache) {
            self._cache = null;
            self._lastBaseRef = null;
            self._lastAnomRef = null;
        }

        if (!baseData) return null;

        const anomalyMap = isToday ? anomaliesToday : anomaliesHistorical;

        // If anomaly map not ready yet, return base with anomaly=null but reuse prior if possible
        if (!anomalyMap) {
            // If previous cache already corresponds to this baseData and had null anomalies, reuse
            if (self._lastBaseRef === baseData && self._lastAnomRef == null && self._cache) {
                return self._cache;
            }
            const merged: PlotDatum[] = baseData.map(d => ({ ...d, anomaly: null }));
            self._cache = merged;
            self._lastBaseRef = baseData;
            self._lastAnomRef = null;
            return merged;
        }

        // Structural sharing if unchanged
        if (self._lastBaseRef === baseData && self._lastAnomRef === anomalyMap && self._cache) {
            return self._cache;
        }

        if (import.meta.env.MODE === 'development') {
            console.time('plotData-merge-build');
        }

        const merged: PlotDatum[] = baseData.map(d => ({ ...d, anomaly: anomalyMap[d.stationId] ?? null }));

        self._cache = merged;
        self._lastBaseRef = baseData;
        self._lastAnomRef = anomalyMap;

        if (import.meta.env.MODE === 'development') {
            console.timeEnd('plotData-merge-build');
        }

        return merged;
    }
);

// ---------------------------------------------
// Sampling selector for contours (simple every-N strategy)
// ---------------------------------------------
const CONTOUR_SAMPLE_TARGET = 10000;
export const selectSampledPlotData = createSelector(
    [selectPlotData],
    (plotData): PlotDatum[] | null => {
        const self: any = selectSampledPlotData as any;
        if (!self._cache) {
            self._cache = null;
            self._lastKey = null;
            self._lastPlotRef = null;
        }
        if (!plotData) return self._cache;
        const length = plotData.length;
        const key = `${length}`;
        // If the underlying plotData reference changed, resample even if length is the same
        const plotRefChanged = self._lastPlotRef !== plotData;
        if (!plotRefChanged && self._lastKey === key && self._cache) return self._cache;
        if (length <= CONTOUR_SAMPLE_TARGET) {
            self._cache = plotData; // reuse reference (safe read-only)
            self._lastKey = key;
            self._lastPlotRef = plotData;
            return plotData;
        }
        const step = Math.ceil(length / CONTOUR_SAMPLE_TARGET);
        const sampled: PlotDatum[] = [];
        for (let i = 0; i < length; i += step) {
            const item = plotData[i];
            if (item) sampled.push(item);
        }
        self._cache = sampled;
        self._lastKey = key;
        self._lastPlotRef = plotData;
        return sampled;
    }
);

// ---------------------------------------------
// Filtered city label data (predefined + remembered + selected) decoupled from station/anomaly readiness
// ---------------------------------------------
export interface CityLabelDatum {
    cityId: string;
    cityName: string;
    cityLat: number;
    cityLon: number;
}

const selectRememberedCityIds = (state: RootState) => state.rememberedCities as string[];
const selectSelectedCityId = (state: RootState) => state.selectedCity.cityId as string | null;

export const selectCityLabelPlotData = createSelector(
    [selectCitiesJSON, selectCityDataStatus, selectRememberedCityIds, selectSelectedCityId],
    (cities, cityStatus, rememberedCityIds, selectedCityId): CityLabelDatum[] | null => {
        if (cityStatus !== 'succeeded' || !cities) return null;
        const rememberedSet = new Set(rememberedCityIds);
        const predefinedSet = new Set(PREDEFINED_CITIES.map(c => c.toLowerCase()));
        const out: CityLabelDatum[] = [];
        for (const [cityId, cityJSON] of Object.entries(cities)) {
            const name = (cityJSON as any).name as string;
            const isPredefined = predefinedSet.has(name.toLowerCase());
            const isRemembered = rememberedSet.has(cityId);
            const isSelected = selectedCityId != null && cityId === selectedCityId;
            if (!(isPredefined || isRemembered || isSelected)) continue;
            out.push({
                cityId,
                cityName: name,
                cityLat: (cityJSON as any).lat,
                cityLon: (cityJSON as any).lon,
            });
        }
        return out.length ? out : [];
    }
);
