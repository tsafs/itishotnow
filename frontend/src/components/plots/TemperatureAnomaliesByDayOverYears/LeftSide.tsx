import { useEffect, useRef, useState, useMemo } from 'react';
import type { CSSProperties } from 'react';
import * as Plot from "@observablehq/plot";
import { html } from 'htl';
import * as d3 from "d3";
import { getNow } from '../../../utils/dateUtils.js';
import { filterTemperatureDataByDateWindow } from './rollingAverageUtils.js';
import { theme, createStyles } from '../../../styles/design-system.js';
import { useBreakpoint } from '../../../hooks/useBreakpoint.js';
import { selectRollingAverageData } from '../../../store/slices/rollingAverageDataSlice.js';
import {
    useSelectedCityName,
    useSelectedStationData,
    useTemperatureAnomaliesDataStatus,
} from '../../../store/hooks/hooks.js';
import { DateTime } from 'luxon';
import { useSelectedDate } from '../../../store/slices/selectedDateSlice.js';
import { useAppSelector } from '../../../store/hooks/useAppSelector.js';
import { useAppDispatch } from '../../../store/hooks/useAppDispatch.js';
import {
    setCityChangeRenderComplete,
    useTemperatureAnomaliesRenderComplete,
} from '../../../store/slices/temperatureAnomaliesByDayOverYearsSlice.js';
import { useAsyncLoadingOverlay } from '../../../hooks/useAsyncLoadingOverlay.js';
import { MIN_LOADING_DISPLAY_DURATION } from '../../../constants/page.js';
import LoadingError from '../../common/LoadingError/LoadingError.js';
import './LeftSide.css';

interface BasePlotEntry {
    year: number;
    temperature: number;
    date: string;
    isPrimaryDay: boolean;
    isCurrent?: boolean;
}

type PlotEntry = BasePlotEntry & { anomaly: number };

// Pure style computation functions
const getContainerStyle = (isMobile: boolean): CSSProperties => ({
    overflow: 'visible',
    textAlign: 'center',
    margin: isMobile ? 0 : undefined,
});

const getErrorStyle = (): CSSProperties => ({
    padding: theme.spacing.lg,
    textAlign: 'center',
    width: '100%',
    boxSizing: 'border-box',
    color: '#d32f2f',
    fontWeight: 500,
});

const styles = createStyles({
    plotWrapper: {
        position: 'relative',
        width: '100%',
        minHeight: 360,
    },
    plotRef: {
        overflow: 'visible',
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
});

const TemperatureAnomaliesByDayOverYearsLeftSide = () => {
    const dispatch = useAppDispatch();
    const breakpoint = useBreakpoint();

    const containerRef = useRef<HTMLDivElement | null>(null);
    const selectedCityName = useSelectedCityName();
    const selectedStationData = useSelectedStationData();
    const selectedDate = useSelectedDate();

    const rollingAverageData = useAppSelector(selectRollingAverageData);

    const [error, setError] = useState<string | null>(null);

    const renderComplete = useTemperatureAnomaliesRenderComplete();
    const { isLoading: isOverlayVisible, error: loadingError } = useAsyncLoadingOverlay({
        dataStatusHook: useTemperatureAnomaliesDataStatus,
        renderCompleteSignal: renderComplete,
        minDisplayDuration: MIN_LOADING_DISPLAY_DURATION,
    });

    const isMobile = breakpoint === 'mobile';

    const fromYear = 1951;
    const toYear = 2024;
    const baselineStartYear = 1961; // Define baseline start year
    const baselineEndYear = 1990;   // Define baseline end year

    useEffect(() => {
        if (loadingError) {
            dispatch(setCityChangeRenderComplete(true));
        }
    }, [dispatch, loadingError]);

    // Create the plot using Observable Plot
    useEffect(() => {
        if (!selectedCityName || !selectedStationData || !selectedDate) return;

        setError(null);

        if (!Array.isArray(rollingAverageData) || rollingAverageData.length === 0) return;

        // Clear any existing plot
        if (containerRef.current) {
            containerRef.current.innerHTML = '';
        }

        // Parse the date to get day and month
        const luxonDate = DateTime.fromISO(selectedDate);
        const month = String(luxonDate.month).padStart(2, '0');
        const day = String(luxonDate.day).padStart(2, '0');
        const todayMonthDay = `${month}-${day}`;
        const isToday = luxonDate.hasSame(getNow(), 'day');

        try {
            // Filter data for our date window (±7 days)
            const { primaryDayData, surroundingDaysData } =
                filterTemperatureDataByDateWindow(rollingAverageData, todayMonthDay, 7, fromYear, toYear);

            if (primaryDayData.length === 0) {
                setError(`No data found for ${todayMonthDay} in the selected time period`);
                dispatch(setCityChangeRenderComplete(true));
                return;
            }

            const mapEntry = (entry: typeof primaryDayData[number]): BasePlotEntry | null => {
                const [yearString] = entry.date.split('-');
                const year = Number(yearString);
                const temperature = typeof entry.tas === 'number' ? entry.tas : null;

                if (!Number.isFinite(year) || temperature === null) {
                    return null;
                }

                return {
                    year,
                    temperature,
                    date: entry.date,
                    isPrimaryDay: entry.isPrimaryDay,
                } satisfies BasePlotEntry;
            };

            const formattedPrimaryData = primaryDayData
                .map(mapEntry)
                .filter((entry): entry is BasePlotEntry => entry !== null);

            const formattedSurroundingData = surroundingDaysData
                .map(mapEntry)
                .filter((entry): entry is BasePlotEntry => entry !== null);

            // Calculate average temperature only for the baseline period (1961-1990)
            const baselinePrimaryDayData = formattedPrimaryData.filter(
                d => d.year >= baselineStartYear && d.year <= baselineEndYear
            );

            const averageTempForPrimaryDay = d3.mean(baselinePrimaryDayData, d => d.temperature);

            if (averageTempForPrimaryDay == null) {
                setError('Insufficient baseline data to compute anomalies');
                dispatch(setCityChangeRenderComplete(true));
                return;
            }

            if (Number.isNaN(averageTempForPrimaryDay)) {
                setError('Baseline data produced invalid average value');
                dispatch(setCityChangeRenderComplete(true));
                return;
            }

            // Calculate anomalies for primary day
            const primaryDayWithAnomalies: PlotEntry[] = formattedPrimaryData.map(entry => ({
                ...entry,
                anomaly: entry.temperature - averageTempForPrimaryDay
            }));

            // Calculate anomalies for surrounding days (relative to primary day average)
            const surroundingDaysWithAnomalies: PlotEntry[] = formattedSurroundingData.map(entry => ({
                ...entry,
                anomaly: entry.temperature - averageTempForPrimaryDay
            }));

            // Combine datasets
            const allDataWithAnomalies: PlotEntry[] = [
                ...primaryDayWithAnomalies,
                ...surroundingDaysWithAnomalies
            ];

            // Add today's data point if available
            let todayDataPoint: PlotEntry | null = null;
            const { minTemperature, maxTemperature } = selectedStationData;
            if (typeof minTemperature === 'number' && typeof maxTemperature === 'number') {
                // Workaround until the true mean is calculated on the backend job:
                const averageTemperature = (minTemperature + maxTemperature) / 2;
                const todayAnomaly = averageTemperature - averageTempForPrimaryDay;
                todayDataPoint = {
                    year: luxonDate.year,
                    temperature: averageTemperature,
                    anomaly: todayAnomaly,
                    date: `${luxonDate.year}-${month}-${day}`,
                    isPrimaryDay: true,
                    isCurrent: true
                };
            }

            // Sort by year for better visualization
            allDataWithAnomalies.sort((a, b) => a.year - b.year);

            // Calculate trend per decade
            const primaryDayData2 = allDataWithAnomalies.filter(d => d.isPrimaryDay);

            let trendPerDecade = 0;
            if (primaryDayData2.length >= 2) {
                const n = primaryDayData2.length;
                const sumX = d3.sum(primaryDayData2.map(({ year }) => year));
                const sumY = d3.sum(primaryDayData2.map(({ anomaly }) => anomaly));
                const sumXY = d3.sum(primaryDayData2.map(({ year, anomaly }) => year * anomaly));
                const sumXX = d3.sum(primaryDayData2.map(({ year }) => year * year));
                const denominator = n * sumXX - sumX * sumX;

                if (denominator !== 0) {
                    const slope = (n * sumXY - sumX * sumY) / denominator;
                    trendPerDecade = slope * 10; // Convert per year to per decade
                }
            }

            // Format trend with German number format (comma as decimal separator)
            const formattedTrend = trendPerDecade.toFixed(1).replace('.', ',');

            const anomaliesForDetails = allDataWithAnomalies.filter(d => d.isPrimaryDay);
            if (todayDataPoint) {
                anomaliesForDetails.push(todayDataPoint);
            }

            // Create the plot
            const plot = Plot.plot({
                title: html`<p class="title">Abweichung zum Referenzzeitraum von 1961 bis 1990 in ${selectedCityName}</p>`,
                y: {
                    label: "Temperaturabweichung (°C)",
                    grid: true,
                    nice: true,
                    labelOffset: 55,
                    labelAnchor: "center",
                    tickSize: 5,
                    labelArrow: false,
                },
                x: {
                    label: null,
                    domain: [fromYear - 1, toYear + 1], // Extend domain to include the today point
                    tickFormat: d => Math.round(d).toString(), // Format years as integers without decimal points
                    tickSize: 5,
                    tickPadding: 5,
                },
                color: {
                    scheme: "BuYlRd",
                },
                marks: [
                    Plot.ruleY([0],
                        {
                            stroke: "#666",
                            strokeWidth: 1,
                        }
                    ), // Zero line
                    Plot.ruleX([1961, 1990],
                        {
                            stroke: "#666",
                            strokeWidth: 1,
                            strokeDasharray: "5,2"
                        }
                    ), // Baseline period line
                    // Background dots for surrounding days
                    Plot.dot(allDataWithAnomalies.filter(d => !d.isPrimaryDay), {
                        x: "year",
                        y: "anomaly",
                        stroke: "#ddd",
                        fill: "#ddd",
                        r: 2,
                    }),
                    // Trend line for primary day
                    Plot.linearRegressionY(allDataWithAnomalies.filter(d => d.isPrimaryDay), {
                        x: "year",
                        y: "anomaly",
                        stroke: "#333",       // Line color
                        strokeWidth: 1,       // Line thickness
                        strokeOpacity: 1,   // Line opacity
                        strokeDasharray: "5,2", // Optional: makes the line dashed
                    }),
                    // Primary dots for the target day
                    Plot.dot(allDataWithAnomalies.filter(d => d.isPrimaryDay), {
                        x: "year",
                        y: "anomaly",
                        stroke: "anomaly",
                        strokeWidth: 2,
                        fill: "anomaly",
                        fillOpacity: 0.2,
                        r: 4,
                    }),
                    // Today's data point as a separate element
                    todayDataPoint && Plot.dot([todayDataPoint], {
                        x: "year",
                        y: "anomaly",
                        stroke: "anomaly",
                        fill: "anomaly",
                        fillOpacity: 0.2,
                        strokeWidth: 2,
                        r: 6,
                    }),
                    // Custom label for today's data point
                    todayDataPoint && Plot.text([todayDataPoint], {
                        x: "year",
                        y: d => d.anomaly + 0.7, // Position slightly above the point
                        text: () => isToday ? "Heute" : luxonDate.setLocale('de').toFormat("d. MMMM yyyy"),
                        className: "today-label",
                    }),
                    // Display trend information
                    Plot.text([{ year: 1975, anomaly: 1.6 }], {
                        x: "year",
                        y: "anomaly",
                        text: () => `Trend: ${formattedTrend}°C / Jahrzehnt`,
                        fontSize: 12,
                        fontWeight: "bold",
                        fill: "#333",
                    }),
                    // Details top left corner
                    Plot.text(anomaliesForDetails, Plot.pointerX({
                        px: "year",
                        py: "anomaly",
                        dy: -17,
                        frameAnchor: "top",
                        text: (d: PlotEntry) => [
                            DateTime.fromISO(d.date).setLocale('de').toFormat("d. MMMM yyyy"),
                            `Durchschnittstemperatur: ${d.temperature.toFixed(1)}°C`,
                            `Abweichung: ${d.anomaly.toFixed(1)}°C`
                        ].join("   "),
                        className: "hover-text",
                    }))
                ]
            });

            containerRef.current?.appendChild(plot);

            dispatch(setCityChangeRenderComplete(true));

            return () => plot.remove();
        } catch (err) {
            console.error("Error creating plot:", err);
            setError("Failed to create plot visualization");
            dispatch(setCityChangeRenderComplete(true));
        }
    }, [dispatch, rollingAverageData, selectedStationData, selectedCityName, fromYear, toYear, selectedDate]);

    // Memoized computed styles
    const containerStyle = useMemo(
        () => getContainerStyle(isMobile),
        [isMobile]
    );

    const errorStyle = useMemo(
        () => getErrorStyle(),
        []
    );

    return (
        <div style={containerStyle} className="temperature-scatter-plot-container">
            <div style={styles.plotWrapper}>
                <div ref={containerRef} style={styles.plotRef}></div>
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
            {error && <div style={errorStyle}>{error}</div>}
            <style>{`
                @keyframes shimmer {
                    0%, 100% { opacity: 0.3; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.2); }
                }
            `}</style>
        </div>
    );
};

TemperatureAnomaliesByDayOverYearsLeftSide.displayName = 'TemperatureAnomaliesByDayOverYearsLeftSide';

export default TemperatureAnomaliesByDayOverYearsLeftSide;
