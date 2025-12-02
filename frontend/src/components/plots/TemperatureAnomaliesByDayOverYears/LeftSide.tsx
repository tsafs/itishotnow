import { useEffect, useRef, useMemo } from 'react';
import type { CSSProperties } from 'react';
import * as Plot from "@observablehq/plot";
import type { Markish } from "@observablehq/plot";
import { html } from 'htl';
import { DateTime } from 'luxon';
import { theme, createStyles } from '../../../styles/design-system.js';
import { useBreakpoint } from '../../../hooks/useBreakpoint.js';
import { useSelectedCityName, useTemperatureAnomaliesDataStatus } from '../../../store/hooks/hooks.js';
import { useAppDispatch } from '../../../store/hooks/useAppDispatch.js';
import {
    setCityChangeRenderComplete,
    useTemperatureAnomaliesRenderComplete,
} from '../../../store/slices/temperatureAnomaliesByDayOverYearsSlice.js';
import { MIN_LOADING_DISPLAY_DURATION } from '../../../constants/page.js';
import AsyncLoadingOverlayWrapper from '../../common/AsyncLoadingOverlayWrapper/AsyncLoadingOverlayWrapper.js';
import { useTemperatureAnomalyPlotData } from './hooks/useTemperatureAnomalyPlotData.js';
import './LeftSide.css';

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
});

const TemperatureAnomaliesByDayOverYearsLeftSide = () => {
    const dispatch = useAppDispatch();
    const breakpoint = useBreakpoint();

    const containerRef = useRef<HTMLDivElement | null>(null);
    const selectedCityName = useSelectedCityName();

    const renderComplete = useTemperatureAnomaliesRenderComplete();

    const isMobile = breakpoint === 'mobile';

    const fromYear = 1951;
    const toYear = 2024;
    const baselineStartYear = 1961; // Define baseline start year
    const baselineEndYear = 1990;   // Define baseline end year

    const {
        plotData,
        anomaliesForDetails,
        todayDataPoint,
        formattedTrend,
        isToday,
        targetDate,
        error: plotDataError,
    } = useTemperatureAnomalyPlotData({
        fromYear,
        toYear,
        baselineStartYear,
        baselineEndYear,
    });

    useEffect(() => {
        const container = containerRef.current;

        if (!container) {
            return;
        }

        container.innerHTML = '';

        if (!selectedCityName || !plotData || !targetDate) return;

        try {
            const primaryDayOnly = plotData.filter((d) => d.isPrimaryDay);

            const marks: Markish[] = [
                Plot.ruleY([0], {
                    stroke: "#666",
                    strokeWidth: 1,
                }),
                Plot.ruleX([baselineStartYear, baselineEndYear], {
                    stroke: "#666",
                    strokeWidth: 1,
                    strokeDasharray: "5,2",
                }),
                Plot.dot(
                    plotData.filter((d) => !d.isPrimaryDay),
                    {
                        x: "year",
                        y: "anomaly",
                        stroke: "#ddd",
                        fill: "#ddd",
                        r: 2,
                    }
                ),
                Plot.linearRegressionY(primaryDayOnly, {
                    x: "year",
                    y: "anomaly",
                    stroke: "#333",
                    strokeWidth: 1,
                    strokeOpacity: 1,
                    strokeDasharray: "5,2",
                }),
                Plot.dot(primaryDayOnly, {
                    x: "year",
                    y: "anomaly",
                    stroke: "anomaly",
                    strokeWidth: 2,
                    fill: "anomaly",
                    fillOpacity: 0.2,
                    r: 4,
                })
            ];

            if (todayDataPoint) {
                marks.push(
                    Plot.dot([todayDataPoint], {
                        x: "year",
                        y: "anomaly",
                        stroke: "anomaly",
                        fill: "anomaly",
                        fillOpacity: 0.2,
                        strokeWidth: 2,
                        r: 6,
                    })
                );

                marks.push(
                    Plot.text([todayDataPoint], {
                        x: "year",
                        y: (d) => d.anomaly + 0.7,
                        text: () => (isToday ? "Heute" : targetDate.setLocale('de').toFormat("d. MMMM yyyy")),
                        className: "today-label",
                    })
                );
            }

            if (formattedTrend) {
                marks.push(
                    Plot.text([{ year: 1975, anomaly: 1.6 }], {
                        x: "year",
                        y: "anomaly",
                        text: () => `Trend: ${formattedTrend}°C / Jahrzehnt`,
                        fontSize: 12,
                        fontWeight: "bold",
                        fill: "#333",
                    })
                );
            }

            marks.push(
                Plot.text(
                    anomaliesForDetails,
                    Plot.pointerX({
                        px: "year",
                        py: "anomaly",
                        dy: -17,
                        frameAnchor: "top",
                        text: (d) => [
                            DateTime.fromISO(d.date).setLocale('de').toFormat("d. MMMM yyyy"),
                            `Durchschnittstemperatur: ${d.temperature.toFixed(1)}°C`,
                            `Abweichung: ${d.anomaly.toFixed(1)}°C`,
                        ].join("   "),
                        className: "hover-text",
                    })
                )
            );

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
                    domain: [fromYear - 1, toYear + 1],
                    tickFormat: (d) => Math.round(d).toString(),
                    tickSize: 5,
                    tickPadding: 5,
                },
                color: {
                    scheme: "BuYlRd",
                },
                marks,
            });

            container.appendChild(plot as unknown as HTMLElement);
            dispatch(setCityChangeRenderComplete(true));

            return () => {
                plot.remove();
            };
        } catch (err) {
            console.error("Error creating plot:", err);
            dispatch(setCityChangeRenderComplete(true));
        }
    }, [
        anomaliesForDetails,
        baselineEndYear,
        baselineStartYear,
        dispatch,
        formattedTrend,
        fromYear,
        isToday,
        plotData,
        selectedCityName,
        targetDate,
        todayDataPoint,
        toYear,
    ]);

    useEffect(() => {
        if (plotDataError) {
            console.error("Error loading plot data:", plotDataError);
            dispatch(setCityChangeRenderComplete(true));
        }
    }, [plotDataError, dispatch]);

    // Memoized computed styles
    const containerStyle = useMemo(
        () => getContainerStyle(isMobile),
        [isMobile]
    );

    return (
        <div style={containerStyle} className="temperature-scatter-plot-container">
            <AsyncLoadingOverlayWrapper
                dataStatusHook={useTemperatureAnomaliesDataStatus}
                renderCompleteSignal={renderComplete}
                minDisplayDuration={MIN_LOADING_DISPLAY_DURATION}
                onError={() => dispatch(setCityChangeRenderComplete(true))}
                style={styles.plotWrapper}
            >
                <div ref={containerRef} style={styles.plotRef}></div>
            </AsyncLoadingOverlayWrapper>
        </div>
    );
};

TemperatureAnomaliesByDayOverYearsLeftSide.displayName = 'TemperatureAnomaliesByDayOverYearsLeftSide';

export default TemperatureAnomaliesByDayOverYearsLeftSide;
