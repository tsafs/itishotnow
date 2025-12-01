import { useEffect, useRef, useCallback, useMemo, memo, useState } from 'react';
import type { CSSProperties } from 'react';
import * as Plot from "@observablehq/plot";
import { selectCity } from '../../../store/slices/selectedCitySlice.js';
import { PREDEFINED_CITIES } from '../../../constants/map.js';
import MapLegend from './MapLegend.js';
import { theme, createStyles } from '../../../styles/design-system.js';
import { useBreakpoint, useBreakpointDown } from '../../../hooks/useBreakpoint.js';
import { useSelectedDate } from '../../../store/slices/selectedDateSlice.js';
import { DateTime } from 'luxon';
import { getNow } from '../../../utils/dateUtils.js';
import { useAppDispatch } from '../../../store/hooks/useAppDispatch.js';
import { fetchGeoJSON } from '../../../store/slices/geoJsonSlice.js';
import { useSampledPlotData, useCityLabelPlotData, useGeoJSON, useGeoJSONStatus, useHeatmapDataStatus } from '../../../store/hooks/hooks.js';
import type { CityLabelDatum } from '../../../store/selectors/heatmapSelectors.js';
import { MIN_LOADING_DISPLAY_DURATION } from '../../../constants/page.js';
import { setDateChangeRenderComplete, useHeatmapRenderComplete } from '../../../store/slices/heatmapGermanySlice.js';
import { useDateDependentLoading } from '../../../hooks/useDateDependentLoading.js';
import LoadingError from '../../common/LoadingError/LoadingError.js';

const getPlotContainerLeftAlignStyle = (isVertical: boolean): CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: isVertical ? 'center' : 'flex-start',
    width: '100%',
});

const getPlotStyle = (dims: { width: number; height: number }): CSSProperties => ({
    position: 'relative',
    width: dims.width,
    height: dims.height,
    marginBottom: theme.spacing.sm,
});

const styles = createStyles({
    plotContainer: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
    },
    plotAnimationWrapper: {
        position: 'relative' as const,
        width: '100%',
        height: '100%',
        opacity: 0,
        transition: 'opacity 0.4s ease-in',
    },
    plotAnimationWrapperVisible: {
        opacity: 1,
    },
    staticPlot: {
        width: '100%',
        height: '100%',
        filter: 'drop-shadow(0 0 20px rgba(0, 0,0 ,1))',
    },
    dynamicPlot: {
        position: 'absolute' as const,
        left: 0,
        top: 0,
        zIndex: 1,
        color: theme.colors.textDark
    },
    loadingOverlay: {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        zIndex: 2,
    },
    shimmerContainer: {
        display: 'flex',
        gap: '8px',
    },
    shimmerDot: {
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        backgroundColor: theme.colors.backgroundLight,
        animation: 'shimmer 1.4s ease-in-out infinite',
    },
    textStyle: {
        fontSize: 12,
        dy: 8
    },
    plotStyle: {
        stroke: '#000',
        strokeWidth: 1,
        fill: 'white'
    }
});

const HeatmapGermanyRightSide = memo(() => {
    const dispatch = useAppDispatch();
    const breakpoint = useBreakpoint();
    const isVertical = useBreakpointDown('desktop');

    // Fixed dimensions per breakpoint to keep projected shape scale consistent
    const MAP_DIMENSIONS: Record<'mobile' | 'tablet' | 'desktop' | 'wide', { width: number; height: number }> = {
        mobile: { width: 320, height: 435 },
        tablet: { width: 460, height: 625 },
        desktop: { width: 640, height: 870 },
        wide: { width: 700, height: 952 }
    };
    const plotDims = MAP_DIMENSIONS[breakpoint];
    console.log('HeatmapGermanyRightSide render - breakpoint:', breakpoint, 'dims:', plotDims);

    const sampledPlotData = useSampledPlotData();
    const selectedDate = useSelectedDate();
    const cityLabelData = useCityLabelPlotData();
    const geojson = useGeoJSON();
    const geojsonStatus = useGeoJSONStatus();
    const renderComplete = useHeatmapRenderComplete();

    const staticPlotRef = useRef<HTMLDivElement | null>(null);
    const dynamicPlotRef = useRef<HTMLDivElement | null>(null);
    const lastSelectedCityId = useRef<string | null>(null);

    // Track initial mount to show loading only on first render
    const isInitialMount = useRef<boolean>(true);
    const initialFadeTimeoutRef = useRef<number | null>(null);

    const [isPlotVisible, setShouldAnimatePlot] = useState<boolean>(false);

    const { isLoading: isOverlayVisible, error: loadingError } = useDateDependentLoading({
        dataStatusHook: useHeatmapDataStatus,
        renderCompleteSignal: renderComplete,
        minDisplayDuration: MIN_LOADING_DISPLAY_DURATION,
    });

    useEffect(() => {
        if (loadingError) {
            dispatch(setDateChangeRenderComplete(true));
        }
    }, [dispatch, loadingError]);

    const isToday = useMemo(() => DateTime.fromISO(selectedDate).hasSame(getNow(), 'day'), [selectedDate]);

    useEffect(() => {
        if (geojsonStatus === 'idle') {
            dispatch(fetchGeoJSON());
        }
    }, [geojsonStatus, dispatch]);

    const idleIdRef = useRef<number | null>(null);

    useEffect(() => {
        const hasGeoJSON = !!geojson;
        const hasSampledData = Array.isArray(sampledPlotData) && sampledPlotData.length > 0;
        const hasAnomalyData = hasSampledData && sampledPlotData.some(d => typeof d.anomaly === 'number');

        // Skip if we have neither geojson nor sampled data.
        if (!hasGeoJSON && !hasSampledData) return;

        // Skip if we have real data, but no geojson. Cannot build plot yet.
        // This happens when data loads before geojson.
        if (!hasGeoJSON && hasSampledData) return;

        // Wait for anomaly data before rebuilding the heatmap after the initial outline.
        if (hasGeoJSON && hasSampledData && !hasAnomalyData) return;

        // Skip if we have geojson but no sampled data and it's not the initial mount.
        if (hasGeoJSON && !hasSampledData && !isInitialMount.current) return;

        // We will only reach this point if:
        // 1) We have geojson but no sampled data and it's the initial mount (initial outline render)
        // 2) We have both geojson and sampled data

        // Cancel previous idle task if any
        if (idleIdRef.current !== null && 'cancelIdleCallback' in window) {
            (window as any).cancelIdleCallback(idleIdRef.current);
        }

        const build = () => {
            let isOutlineOnly = false;
            let staticPlot;
            if (hasGeoJSON && !hasSampledData) {
                isOutlineOnly = true;
                staticPlot = Plot.plot({
                    projection: { type: 'mercator', domain: geojson },
                    marks: [Plot.geo(geojson, styles.plotStyle)],
                    width: plotDims.width,
                    height: plotDims.height,
                });
            } else if (hasGeoJSON && hasSampledData && hasAnomalyData) {
                staticPlot = Plot.plot({
                    projection: { type: 'mercator', domain: geojson },
                    color: { type: 'diverging', scheme: 'Turbo', domain: [-10, 10], pivot: 0 },
                    marks: [
                        // Use sampled data for contours to reduce computation
                        Plot.geo(geojson, styles.plotStyle),
                        Plot.contour(sampledPlotData, {
                            x: 'stationLon',
                            y: 'stationLat',
                            fill: 'anomaly',
                            blur: 1.5,
                            clip: geojson,
                        }),
                    ],
                    width: plotDims.width,
                    height: plotDims.height,
                });
            } else {
                // This should not happen, see conditions that execute build().
                console.error('Cannot build heatmap static plot: unexpected state.');
                return;
            }

            const showPlot = () => {
                if (staticPlotRef.current) {
                    staticPlotRef.current.innerHTML = '';
                    staticPlotRef.current.appendChild(staticPlot);
                }
            }

            if (isOutlineOnly) {
                showPlot();
                if (isInitialMount.current) {
                    setShouldAnimatePlot(true);
                }
                return;
            }

            showPlot();

            if (isInitialMount.current) {
                isInitialMount.current = false;
                if (initialFadeTimeoutRef.current !== null) {
                    window.clearTimeout(initialFadeTimeoutRef.current);
                }
                initialFadeTimeoutRef.current = window.setTimeout(() => {
                    setShouldAnimatePlot(true);
                    dispatch(setDateChangeRenderComplete(true));
                    initialFadeTimeoutRef.current = null;
                }, MIN_LOADING_DISPLAY_DURATION);
            } else {
                setShouldAnimatePlot(true);
                dispatch(setDateChangeRenderComplete(true));
            }
        };


        if (hasGeoJSON && !hasSampledData && isInitialMount.current) {
            build();
        } else if (hasGeoJSON && hasSampledData && hasAnomalyData) {
            if ('requestIdleCallback' in window) {
                idleIdRef.current = requestIdleCallback(build);
            } else {
                idleIdRef.current = (window as any).setTimeout(build, 0);
            }
        } else {
            console.error('Cannot schedule heatmap static plot build: unexpected state.');
        }
    }, [sampledPlotData, geojson, dispatch, plotDims.width, plotDims.height]);

    useEffect(() => {
        return () => {
            if (initialFadeTimeoutRef.current !== null) {
                window.clearTimeout(initialFadeTimeoutRef.current);
                initialFadeTimeoutRef.current = null;
            }
        };
    }, []);

    // Render dynamic overlays (city dots, labels, selection) on every relevant state change
    const renderDynamicOverlay = useCallback(() => {
        const isDataPresent = !!cityLabelData && !!geojson;
        if (!isDataPresent || !renderComplete) return;

        if (dynamicPlotRef.current) {
            dynamicPlotRef.current.innerHTML = '';
        }

        const { fontSize, dy } = styles.textStyle;

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
            ],
            width: plotDims.width,
            height: plotDims.height,
        });

        dynamicPlot.addEventListener("input", () => {
            // If no city is selected, do nothing
            const value = dynamicPlot.value as CityLabelDatum | null;
            if (!value) return;

            // Prevent unnecessary dispatches if the hovered or selected city hasn't changed
            if (value.cityId === lastSelectedCityId.current) return;
            lastSelectedCityId.current = value.cityId;

            const isPredefined = PREDEFINED_CITIES.includes(value.cityName);
            dispatch(selectCity(value.cityId, !isPredefined));
        });

        dynamicPlotRef.current?.appendChild(dynamicPlot as unknown as HTMLElement);
    }, [
        cityLabelData,
        geojson,
        dispatch,
        breakpoint,
        renderComplete,
        plotDims.width,
        plotDims.height
    ]);

    useEffect(() => {
        renderDynamicOverlay();
    }, [renderDynamicOverlay]);

    const plotContainerLeftAlignStyle = useMemo(
        () => getPlotContainerLeftAlignStyle(isVertical),
        [isVertical]
    );

    const plotStyle = useMemo(
        () => getPlotStyle(plotDims),
        [plotDims]
    );

    let title = isToday
        ? "Heutige Temperaturabweichung"
        : "Temperaturabweichung am " + DateTime.fromISO(selectedDate).setLocale('de').toFormat("d. MMMM yyyy");
    title += " zu\u00A01961\u00A0bis\u00A01990\u00A0in\u00A0°C";

    return (
        <div style={plotContainerLeftAlignStyle}>
            <div style={styles.plotContainer}>
                <div style={plotStyle}>
                    <div style={{
                        ...styles.plotAnimationWrapper,
                        ...(isPlotVisible ? styles.plotAnimationWrapperVisible : {})
                    }}>
                        <div ref={staticPlotRef} style={styles.staticPlot}></div>
                        <div ref={dynamicPlotRef} style={styles.dynamicPlot}></div>
                    </div>
                    {isOverlayVisible && (
                        <div style={styles.loadingOverlay}>
                            {loadingError ? (
                                <LoadingError message={loadingError} />
                            ) : (
                                <div style={styles.shimmerContainer}>
                                    <div style={{ ...styles.shimmerDot, animationDelay: '0s' }}></div>
                                    <div style={{ ...styles.shimmerDot, animationDelay: '0.2s' }}></div>
                                    <div style={{ ...styles.shimmerDot, animationDelay: '0.4s' }}></div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <MapLegend title={title} colorScheme="Turbo" />
            </div>
            <style>{`
                @keyframes shimmer {
                    0%, 100% { opacity: 0.3; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.2); }
                }
            `}</style>
        </div>
    );
});

HeatmapGermanyRightSide.displayName = 'HeatmapGermanyRightSide';

export default HeatmapGermanyRightSide;