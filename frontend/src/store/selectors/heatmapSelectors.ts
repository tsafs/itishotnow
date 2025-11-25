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
    temperature: number | undefined;
    maxTemperature: number | undefined;
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
    temperature: number | undefined; // mean / live temperature
    maxTemperature: number | undefined; // max temp (historical tasmax)
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
    temperature: number | undefined; // chosen display temperature (today: current/live; historical: max)
    rawTemperature: number | undefined; // original mean/live value
    rawMaxTemperature: number | undefined; // original max value
    anomaly: undefined; // placeholder for later enrichment stage
}

export interface PlotDatum extends Omit<PlotBaseDatum, 'anomaly'> {
    anomaly: number | undefined;
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
        if (!points) return null;

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
                temperature: typeof displayTemp === 'number' ? displayTemp : undefined,
                rawTemperature: p.temperature,
                rawMaxTemperature: p.maxTemperature,
                anomaly: undefined,
            };
        });

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
        if (!isToday) return null;
        if (!baseData) return null;

        const selectedDateLuxon = DateTime.fromISO(selectedDate);

        const hourlyReady =
            hourlyStatus === 'succeeded' &&
            hourlyData &&
            hourlyContext &&
            hourlyContext.month === selectedDateLuxon.month &&
            hourlyContext.day === selectedDateLuxon.day;
        if (!hourlyReady) return null; // keep previous until ready

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
        selectYearlyMeanByDayStatus
    ],
    (
        baseData,
        isToday,
        yearlyMeanData,
        yearlyMeanStatus
    ): Record<string, number> | null => {
        if (isToday) return null;
        if (!baseData) return null;
        const ready = yearlyMeanStatus === 'succeeded' && yearlyMeanData;
        if (!ready) return null;
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
        if (!baseData) return null;

        const anomalyMap = isToday ? anomaliesToday : anomaliesHistorical;

        if (import.meta.env.MODE === 'development') {
            console.time('plotData-merge-build');
        }

        const merged: PlotDatum[] = baseData.map(d => ({ ...d, anomaly: anomalyMap ? (anomalyMap[d.stationId] ?? undefined) : undefined }));

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
        if (!plotData) return null;
        const length = plotData.length;
        if (length <= CONTOUR_SAMPLE_TARGET) {
            return plotData;
        }
        const step = Math.ceil(length / CONTOUR_SAMPLE_TARGET);
        const sampled: PlotDatum[] = [];
        for (let i = 0; i < length; i += step) {
            const item = plotData[i];
            if (item) sampled.push(item);
        }
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
