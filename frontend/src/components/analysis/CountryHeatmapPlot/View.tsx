import { useEffect, useRef, useCallback, useMemo } from 'react';
import * as Plot from "@observablehq/plot";
import ContentSplit from '../../layout/ContentSplit.js';
import { selectCity } from '../../../store/slices/selectedCitySlice.js';
import { useCorrelatedData, useSelectedCityId, useGeoJSON, useGeoJSONStatus } from '../../../store/hooks/hooks.js';
import type { CorrelatedStationDataMap } from '../../../store/selectors/correlatedDataSelectors.js';
import StationDetails from '../../stationDetails/StationDetails.js';
import { useYearlyMeanByDayData } from '../../../store/slices/YearlyMeanByDaySlice.js';
import { useReferenceYearlyHourlyInterpolatedByDayData } from '../../../store/slices/ReferenceYearlyHourlyInterpolatedByDaySlice.js';
import { PREDEFINED_CITIES } from '../../../constants/map.js';
import MapLegend from '../../d3map/MapLegend.js';
import './View.css';
import { useSelectedDate } from '../../../store/slices/selectedDateSlice.js';
import { DateTime } from 'luxon';
import { getNow } from '../../../utils/dateUtils.js';
import { useAppSelector } from '../../../store/hooks/useAppSelector.js';
import { useAppDispatch } from '../../../store/hooks/useAppDispatch.js';
import type { GermanyBoundaryGeoJSON } from '../../../services/GeoJSONService.js';
import { fetchGeoJSON } from '../../../store/slices/geoJsonSlice.js';

type TemperatureMetric = 'temperature' | 'maxTemperature';

interface PlotDatum {
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
    anomaly?: number | null;
}

type PlotFigure = ReturnType<typeof Plot.plot>;

const getDataForPlot = (
    correlatedData: CorrelatedStationDataMap,
    temperatureType: TemperatureMetric = 'temperature',
): PlotDatum[] => {
    return Object.values(correlatedData).map(({ city, station, data }) => ({
        cityId: city.id,
        cityName: city.name,
        cityLat: city.lat,
        cityLon: city.lon,
        stationId: station.id,
        stationLat: station.lat,
        stationLon: station.lon,
        date: data.date,
        temperature: temperatureType === 'temperature'
            ? data.temperature ?? null
            : data.maxTemperature ?? null,
        rawTemperature: data.temperature ?? null,
        rawMaxTemperature: data.maxTemperature ?? null,
    }));
};

// Helper to get fontSize and dy based on screen width
const getTextStyle = () => {
    const width = window.innerWidth;
    if (width <= 480) {
        return { fontSize: 16, dy: 10 };
    } else if (width <= 768) {
        return { fontSize: 14, dy: 9 };
    } else {
        return { fontSize: 12, dy: 8 };
    }
};

const HistoricalAnalysis = () => {
    const dispatch = useAppDispatch();
    const correlatedData = useCorrelatedData();
    const selectedCityId = useSelectedCityId();
    const selectedDate = useSelectedDate();
    const yearlyMeanByDayData = useYearlyMeanByDayData();
    const referenceYearlyHourlyInterpolatedByDayData = useReferenceYearlyHourlyInterpolatedByDayData();
    const rememberedCityIds = useAppSelector((state) => state.rememberedCities);

    const geojson = useGeoJSON();
    const geojsonStatus = useGeoJSONStatus();

    const staticPlotRef = useRef<HTMLDivElement | null>(null);
    const dynamicPlotRef = useRef<HTMLDivElement | null>(null);
    const lastSelectedCityId = useRef<string | null>(null);

    const isToday = useMemo(() => DateTime.fromISO(selectedDate).hasSame(getNow(), 'day'), [selectedDate]);

    useEffect(() => {
        if (geojsonStatus === 'idle') {
            dispatch(fetchGeoJSON());
        }
    }, [geojsonStatus, dispatch]);

    // Render static plot (base map, contours) only when geojson or correlatedData changes
    useEffect(() => {
        if (!correlatedData || !geojson) return;

        const luxonDate = DateTime.fromISO(selectedDate);
        const isToday = luxonDate.hasSame(getNow(), 'day');
        const data = getDataForPlot(correlatedData, isToday ? 'temperature' : 'maxTemperature');

        if (isToday) {
            if (!referenceYearlyHourlyInterpolatedByDayData) return;
            const { data: hourlyData, month, day } = referenceYearlyHourlyInterpolatedByDayData;
            if (!hourlyData || month !== luxonDate.month || day !== luxonDate.day) return;

            data.forEach((entry) => {
                const stationData = hourlyData[entry.stationId];
                if (!stationData) {
                    entry.anomaly = null;
                    return;
                }

                const parsedDate = DateTime.fromFormat(entry.date, 'dd.MM.yyyy HH:mm', { zone: 'Europe/Berlin' });
                if (!parsedDate.isValid) {
                    entry.anomaly = null;
                    return;
                }

                const hourKey = `hour_${parsedDate.hour}` as const;
                const referenceValue = stationData[hourKey];
                if (typeof entry.temperature === 'number' && typeof referenceValue === 'number') {
                    entry.anomaly = entry.temperature - referenceValue;
                } else {
                    entry.anomaly = null;
                }
            });
        } else {
            if (!yearlyMeanByDayData) return;

            data.forEach((entry) => {
                const reference = yearlyMeanByDayData[entry.stationId]?.tasmax;
                if (typeof entry.temperature === 'number' && typeof reference === 'number') {
                    entry.anomaly = entry.temperature - reference;
                } else {
                    entry.anomaly = null;
                }
            });
        }

        const staticPlot = Plot.plot({
            projection: {
                type: "mercator",
                domain: geojson
            },
            color: {
                type: "diverging",
                scheme: "Turbo",
                domain: [-10, +10],
                pivot: 0
            },
            marks: [
                Plot.contour(
                    data,
                    {
                        x: "stationLon",
                        y: "stationLat",
                        fill: "anomaly",
                        blur: 1.5,
                        clip: geojson
                    }
                ),
                Plot.geo(geojson, { stroke: "black" }),
            ]
        });

        if (staticPlotRef.current) {
            staticPlotRef.current.innerHTML = '';
            staticPlotRef.current.appendChild(staticPlot);
        }
    }, [
        correlatedData,
        geojson,
        yearlyMeanByDayData,
        referenceYearlyHourlyInterpolatedByDayData,
        selectedDate,
    ]);

    // Render dynamic overlays (city dots, labels, selection) on every relevant state change
    const renderDynamicOverlay = useCallback(() => {
        if (!correlatedData || !geojson || !selectedCityId) return;

        if (dynamicPlotRef.current) {
            dynamicPlotRef.current.innerHTML = '';
        }

        // Filter out all data points that do not belong to PREDEFINED_CITIES
        const data = getDataForPlot(correlatedData);
        const cityData = data.filter((entry) => {
            const isPredefined = PREDEFINED_CITIES.some((city) => city.toLowerCase() === entry.cityName.toLowerCase());
            const isRemembered = rememberedCityIds.includes(entry.cityId);
            const isSelected = entry.cityId === selectedCityId;
            return isPredefined || isRemembered || isSelected;
        });

        const { fontSize, dy } = getTextStyle();

        const dynamicPlot = Plot.plot({
            projection: {
                type: "mercator",
                domain: geojson
            },
            marks: [
                Plot.dot(cityData, {
                    x: "cityLon",
                    y: "cityLat",
                    r: 3,
                    fill: "currentColor",
                    stroke: "white",
                    strokeWidth: 1.5,
                }),
                Plot.dot(cityData,
                    Plot.pointer({
                        x: "cityLon",
                        y: "cityLat",
                        stroke: "white",
                        strokeWidth: 3,
                        r: 5
                    })
                ),
                Plot.text(cityData, {
                    x: "cityLon",
                    y: "cityLat",
                    text: (i) => i.cityName,
                    fill: "currentColor",
                    stroke: "white",
                    lineAnchor: "top",
                    dy,
                    fontSize,
                })
            ]
        });

        dynamicPlot.addEventListener("input", () => {
            // If no city is selected, do nothing
            const value = dynamicPlot.value as PlotDatum | null;
            if (!value) return;

            // Prevent unnecessary dispatches if the hovered or selected city hasn't changed
            if (value.cityId === lastSelectedCityId.current) return;
            lastSelectedCityId.current = value.cityId;

            const isPredefined = PREDEFINED_CITIES.includes(value.cityName);
            dispatch(selectCity(value.cityId, isPredefined));
        });

        dynamicPlotRef.current?.appendChild(dynamicPlot as unknown as HTMLElement);
    }, [
        correlatedData,
        geojson,
        selectedCityId,
        rememberedCityIds,
        dispatch,
    ]);

    useEffect(() => {
        renderDynamicOverlay();
    }, [renderDynamicOverlay]);

    // Left side content with tabs for different content types
    const rightContent = (
        <div className="plot-container-left-align">
            <div className="plot-container">
                <div className="plot-title">{isToday ? "Heutige Temperaturabweichung" : "Temperaturabweichung am " + DateTime.fromISO(selectedDate).setLocale('de').toFormat("d. MMMM yyyy")} zu&nbsp;1961&nbsp;bis&nbsp;1990&nbsp;(°C)</div>
                <div className="plot">
                    <div ref={staticPlotRef}></div>
                    <div ref={dynamicPlotRef} className="dynamic-plot"></div>
                </div>
                <MapLegend title="Abweichung (°C)" colorScheme="Turbo" />
            </div>
        </div>
    );

    // Right side content with the scatter plot
    const leftContent = (
        <div className="info">
            <StationDetails />
        </div >
    );

    return (
        <div className="daily-anomaly-explorer">
            <ContentSplit
                leftContent={leftContent}
                rightContent={rightContent}
                leftRatio={45}
                rightRatio={55}
            />
        </div>
    );
};

export default HistoricalAnalysis;
