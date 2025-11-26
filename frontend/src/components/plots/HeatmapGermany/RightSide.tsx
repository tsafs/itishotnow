import { useEffect, useRef, useCallback, useMemo, memo } from 'react';
import type { CSSProperties } from 'react';
import * as Plot from "@observablehq/plot";
import { selectCity } from '../../../store/slices/selectedCitySlice.js';
import { PREDEFINED_CITIES } from '../../../constants/map.js';
import MapLegend from '../../d3map/MapLegend.js';
import { theme, createStyles } from '../../../styles/design-system.js';
import { useBreakpoint } from '../../../hooks/useBreakpoint.js';
import { useSelectedDate } from '../../../store/slices/selectedDateSlice.js';
import { DateTime } from 'luxon';
import { getNow } from '../../../utils/dateUtils.js';
import { useAppDispatch } from '../../../store/hooks/useAppDispatch.js';
import { fetchGeoJSON } from '../../../store/slices/geoJsonSlice.js';
import { useSampledPlotData, useCityLabelPlotData, useGeoJSON, useGeoJSONStatus } from '../../../store/hooks/hooks.js';
import type { PlotDatum, CityLabelDatum } from '../../../store/selectors/heatmapSelectors.js';

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

const HeatmapGermanyRightSide = memo(() => {
    const dispatch = useAppDispatch();
    const breakpoint = useBreakpoint();

    const sampledPlotData = useSampledPlotData();
    const selectedDate = useSelectedDate();
    const cityLabelData = useCityLabelPlotData();
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

    // Contour build dedup + idle scheduling
    const contourDataRef = useRef<PlotDatum[] | null>(null);
    const geojsonRef = useRef<any>(null);
    const idleIdRef = useRef<number | null>(null);

    useEffect(() => {
        // Derive readiness from sampledPlotData presence & geojson status (selector already gates data readiness)
        const isDataPresent = !!sampledPlotData && !!geojson;
        const isNewData = contourDataRef.current !== sampledPlotData || geojsonRef.current !== geojson;
        if (!isDataPresent || !isNewData) return;

        contourDataRef.current = sampledPlotData;
        geojsonRef.current = geojson;

        // Cancel previous idle task if any
        if (idleIdRef.current !== null && 'cancelIdleCallback' in window) {
            (window as any).cancelIdleCallback(idleIdRef.current);
        }

        const build = () => {
            const label = 'contour-build';

            if (import.meta.env.MODE === 'development') console.time(label);

            const staticPlot = Plot.plot({
                projection: { type: 'mercator', domain: geojson },
                color: { type: 'diverging', scheme: 'Turbo', domain: [-10, 10], pivot: 0 },
                marks: [
                    // Use sampled data for contours to reduce computation
                    Plot.contour(sampledPlotData, {
                        x: 'stationLon',
                        y: 'stationLat',
                        fill: 'anomaly',
                        blur: 1.5,
                        clip: geojson,
                    }),
                    Plot.geo(geojson, { stroke: 'black' }),
                ],
            });

            if (staticPlotRef.current) {
                staticPlotRef.current.innerHTML = '';
                staticPlotRef.current.appendChild(staticPlot);
            }

            if (import.meta.env.MODE === 'development') console.timeEnd(label);
        };

        if ('requestIdleCallback' in window) {
            idleIdRef.current = requestIdleCallback(build, { timeout: 120 });
        } else {
            idleIdRef.current = (window as any).setTimeout(build, 0);
        }
    }, [sampledPlotData, geojson]);

    // Render dynamic overlays (city dots, labels, selection) on every relevant state change
    const renderDynamicOverlay = useCallback(() => {
        const isDataPresent = !!cityLabelData && !!geojson;
        if (!isDataPresent) return;

        if (dynamicPlotRef.current) {
            dynamicPlotRef.current.innerHTML = '';
        }

        const { fontSize, dy } = getTextStyle(breakpoint);

        const dynamicPlot = Plot.plot({
            projection: {
                type: "mercator",
                domain: geojson
            },
            marks: [
                Plot.dot(cityLabelData, {
                    x: "cityLon",
                    y: "cityLat",
                    r: 3,
                    fill: "currentColor",
                    stroke: "white",
                    strokeWidth: 1.5,
                }),
                Plot.dot(cityLabelData,
                    Plot.pointer({
                        x: "cityLon",
                        y: "cityLat",
                        stroke: "white",
                        strokeWidth: 3,
                        r: 5
                    })
                ),
                Plot.text(cityLabelData, {
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
            const value = dynamicPlot.value as CityLabelDatum | null;
            if (!value) return;

            // Prevent unnecessary dispatches if the hovered or selected city hasn't changed
            if (value.cityId === lastSelectedCityId.current) return;
            lastSelectedCityId.current = value.cityId;

            const isPredefined = PREDEFINED_CITIES.includes(value.cityName);
            dispatch(selectCity(value.cityId, isPredefined));
        });

        dynamicPlotRef.current?.appendChild(dynamicPlot as unknown as HTMLElement);
    }, [
        cityLabelData,
        geojson,
        dispatch,
        breakpoint,
    ]);

    useEffect(() => {
        renderDynamicOverlay();
    }, [renderDynamicOverlay]);

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

    return (
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
});

HeatmapGermanyRightSide.displayName = 'HeatmapGermanyRightSide';

export default HeatmapGermanyRightSide;