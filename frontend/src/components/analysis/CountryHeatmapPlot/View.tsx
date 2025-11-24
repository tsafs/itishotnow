import { useEffect, useRef, useCallback, useMemo } from 'react';
import type { CSSProperties } from 'react';
import * as Plot from "@observablehq/plot";
import PlotView from '../../common/PlotView/PlotView.js';
import { selectCity } from '../../../store/slices/selectedCitySlice.js';
import { useCorrelatedData, useSelectedCityId, useGeoJSON, useGeoJSONStatus } from '../../../store/hooks/hooks.js';
import type { CorrelatedStationDataMap } from '../../../store/selectors/correlatedDataSelectors.js';
import StationDetails from '../../stationDetails/StationDetails.js';
import { useYearlyMeanByDayData } from '../../../store/slices/YearlyMeanByDaySlice.js';
import { useReferenceYearlyHourlyInterpolatedByDayData } from '../../../store/slices/ReferenceYearlyHourlyInterpolatedByDaySlice.js';
import { PREDEFINED_CITIES } from '../../../constants/map.js';
import MapLegend from '../../d3map/MapLegend.js';
import { theme, createStyles } from '../../../styles/design-system.js';
import { useBreakpoint } from '../../../hooks/useBreakpoint.js';
import { useSelectedDate } from '../../../store/slices/selectedDateSlice.js';
import { DateTime } from 'luxon';
import { getNow } from '../../../utils/dateUtils.js';
import { useAppSelector } from '../../../store/hooks/useAppSelector.js';
import { useAppDispatch } from '../../../store/hooks/useAppDispatch.js';
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

// Helper to get fontSize and dy based on breakpoint
const getTextStyle = (breakpoint: 'mobile' | 'tablet' | 'desktop') => {
    if (breakpoint === 'mobile') {
        return { fontSize: 16, dy: 10 };
    } else if (breakpoint === 'tablet') {
        return { fontSize: 14, dy: 9 };
    } else {
        return { fontSize: 12, dy: 8 };
    }
};

// Pure style computation functions
const getInfoStyle = (isMobile: boolean): CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: isMobile ? 'center' : 'flex-start',
    height: '100%',
    gap: theme.spacing.lg,
    marginTop: isMobile ? 0 : '30%',
    marginRight: isMobile ? 0 : theme.spacing.lg,
    margin: isMobile ? 0 : undefined,
});

const getPlotContainerLeftAlignStyle = (isMobile: boolean): CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: isMobile ? 'center' : 'flex-start',
    width: '100%',
});

const getPlotTitleStyle = (isMobile: boolean): CSSProperties => ({
    maxWidth: isMobile ? '80%' : 500,
    fontSize: isMobile ? theme.typography.fontSize.lg : theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
});

const getPlotStyle = (breakpoint: 'mobile' | 'tablet' | 'desktop'): CSSProperties => ({
    position: 'relative',
    maxWidth: breakpoint === 'mobile' ? '90%' : breakpoint === 'tablet' ? '80%' : 500,
    marginBottom: theme.spacing.sm,
});

const styles = createStyles({
    container: {
        color: theme.colors.textLight,
    },
    plotContainer: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        color: theme.colors.text,
    },
    dynamicPlot: {
        position: 'absolute' as const,
        left: 0,
        top: 0,
        zIndex: 1,
    },
});

const HistoricalAnalysis = () => {
    const dispatch = useAppDispatch();
    const breakpoint = useBreakpoint();
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
    const isMobile = breakpoint === 'mobile' || breakpoint === 'tablet';

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

        const { fontSize, dy } = getTextStyle(breakpoint);

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
        breakpoint,
    ]);

    useEffect(() => {
        renderDynamicOverlay();
    }, [renderDynamicOverlay]);

    // Memoized computed styles
    const infoStyle = useMemo(
        () => getInfoStyle(isMobile),
        [isMobile]
    );

    const plotContainerLeftAlignStyle = useMemo(
        () => getPlotContainerLeftAlignStyle(isMobile),
        [isMobile]
    );

    const plotTitleStyle = useMemo(
        () => getPlotTitleStyle(isMobile),
        [isMobile]
    );

    const plotStyle = useMemo(
        () => getPlotStyle(breakpoint),
        [breakpoint]
    );

    // Right side content with the plot
    const rightContent = (
        <div style={plotContainerLeftAlignStyle}>
            <div style={styles.plotContainer}>
                <div style={plotTitleStyle}>
                    {isToday
                        ? "Heutige Temperaturabweichung"
                        : "Temperaturabweichung am " + DateTime.fromISO(selectedDate).setLocale('de').toFormat("d. MMMM yyyy")
                    } zu&nbsp;1961&nbsp;bis&nbsp;1990&nbsp;(°C)
                </div>
                <div style={plotStyle}>
                    <div ref={staticPlotRef}></div>
                    <div ref={dynamicPlotRef} style={styles.dynamicPlot}></div>
                </div>
                <MapLegend title="Abweichung (°C)" colorScheme="Turbo" />
            </div>
        </div>
    );

    // Left side content with station details
    const leftContent = (
        <div style={infoStyle}>
            <StationDetails />
        </div>
    );

    return (
        <div style={styles.container}>
            <PlotView
                leftContent={leftContent}
                rightContent={rightContent}
                leftWidth={45}
            />
        </div>
    );
};

export default HistoricalAnalysis;
