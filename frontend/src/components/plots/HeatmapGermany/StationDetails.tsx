import { useState, useEffect, useRef, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { theme, createStyles } from '../../../styles/design-system.js';
import { useBreakpointDown } from '../../../hooks/useBreakpoint.js';
import { useAppSelector } from '../../../store/hooks/useAppSelector.js';
import { useStationDetailsData } from './useStationDetailsData.js';
import type { StationDetailsData } from './useStationDetailsData.js';
import { useHeatmapRenderComplete } from '../../../store/slices/heatmapGermanySlice.js';

const getPanelStyle = (isVertical: boolean): CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    maxWidth: 340,
    padding: '0 20px 30px 20px',
    marginTop: 20,
    textAlign: 'center',
    color: theme.colors.textLight,
    // marginRight: isVertical ? 0 : 100,
    textShadow: '0px 0px 10px rgba(0, 0, 0, 1)',
});

const getMetricsStyle = (isVertical: boolean): CSSProperties => ({
    display: 'flex',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
});

const getNameStyle = (isVertical: boolean): CSSProperties => ({
    margin: 0,
    fontSize: '1.6rem',
    lineHeight: 1.2,
    fontWeight: 600,
    color: theme.colors.textLight,
    width: isVertical ? '100%' : undefined,
});

const getSubtitleStyle = (isVertical: boolean): CSSProperties => ({
    fontSize: '0.9rem',
    marginTop: 5,
    marginBottom: 30,
    maxWidth: 300,
    whiteSpaceCollapse: 'preserve' as any,
    textWrap: 'pretty' as any,
    width: isVertical ? '100%' : undefined,
});

const getComparisonStyle = (isVertical: boolean): CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    marginTop: 30,
    maxWidth: 300,
});

const placeholderStyle: CSSProperties = {
    backgroundColor: '#555',
    color: 'transparent',
    borderRadius: 4,
    textShadow: 'none',
};

const styles = createStyles({
    placeholder: {
        fontSize: '1rem',
        textAlign: 'center',
        padding: '30px 0',
    },
    doubleCell: {
        display: 'flex',
        flexDirection: 'row',
        gap: 10,
    },
    metricCell: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 4,
        lineHeight: theme.typography.lineHeight.tight
    },
    metricCellHighlight: {
        backgroundColor: theme.colors.backgroundLight,
        borderRadius: 6,
        paddingLeft: 10,
        paddingRight: 10,
        color: theme.colors.textDark,
        boxShadow: '0px 0px 3px 0px white',
        textShadow: 'none'
    },
    metricLabel: {
        fontSize: '0.8rem',
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    metricValue: {
        fontSize: '1.2rem',
        fontWeight: 'bold',
        marginTop: 4,
        color: theme.colors.textLight,
        textShadow: 'none',
    },
    metricValueHighlight: {
        color: theme.colors.textDark,
    },
    comparisonMessage: {
        fontSize: '1.4rem',
        lineHeight: 1.2,
        fontWeight: 600,
        color: theme.colors.textLight,
    },
    anomaly: {
        marginTop: 5,
        fontSize: '0.8rem',
    },
    nowrap: {
        whiteSpace: 'nowrap',
    },
});

/**
 * Panel component to display city information with nearest weather station data
 */
const StationDetails = () => {
    const selectedCityId = useAppSelector((state) => state.selectedCity.cityId);
    const isVertical = useBreakpointDown('desktop');
    const isHeatmapReady = useHeatmapRenderComplete();

    // Get all computed data synchronously from custom hook
    const computedData = useStationDetailsData();

    // State for displayed data (used to delay updates on initial mount only)
    const [displayData, setDisplayData] = useState<StationDetailsData | null>(null);

    // Handle initial mount delay and subsequent immediate updates
    useEffect(() => {
        // If no data is ready, don't update (wait for all data to be available)
        if (!computedData.item || !computedData.subtitle || !computedData.anomalyDetails || !isHeatmapReady) {
            return;
        }

        setDisplayData(computedData);
    }, [computedData, isHeatmapReady]);

    // Memoized computed styles
    const panelStyle = useMemo(() => getPanelStyle(isVertical), [isVertical]);
    const metricsStyle = useMemo(() => getMetricsStyle(isVertical), [isVertical]);
    const nameStyle = useMemo(() => getNameStyle(isVertical), [isVertical]);
    const subtitleStyle = useMemo(() => getSubtitleStyle(isVertical), [isVertical]);
    const comparisonStyle = useMemo(() => getComparisonStyle(isVertical), [isVertical]);

    // If no city is selected, show a placeholder
    if (!selectedCityId) {
        return (
            <div style={panelStyle}>
                <div style={styles.placeholder}>
                    Klicke auf eine Stadt oder nutze die Suchfunktion um Details anzuzeigen
                </div>
            </div>
        );
    }

    return (
        <div style={panelStyle}>
            {displayData && displayData.item && displayData.anomalyDetails && (
                <>
                    <h2 style={nameStyle}>{displayData.item.city.name}</h2>
                    <div style={subtitleStyle} dangerouslySetInnerHTML={{ __html: displayData.subtitle }} />
                    <div style={metricsStyle}>
                        <div style={styles.doubleCell}>
                            <div style={{ ...styles.metricCell, ...styles.metricCellHighlight }}>
                                <span style={styles.metricLabel}>{displayData.isToday ? "Zuletzt" : "Mittel"}</span>
                                <span style={{ ...styles.metricValue, ...styles.metricValueHighlight }}>
                                    {displayData.item.data.temperature !== undefined
                                        ? `${displayData.item.data.temperature.toFixed(1)}°C`
                                        : "k. A."}
                                </span>
                            </div>
                            <div style={styles.metricCell}>
                                <span style={styles.metricLabel}>Min</span>
                                <span style={styles.metricValue}>
                                    {displayData.item.data.minTemperature !== undefined
                                        ? `${displayData.item.data.minTemperature.toFixed(1)}°C`
                                        : "k. A."}
                                </span>
                            </div>
                        </div>
                        <div style={styles.doubleCell}>
                            <div style={styles.metricCell}>
                                <span style={styles.metricLabel}>Max</span>
                                <span style={styles.metricValue}>
                                    {displayData.item.data.maxTemperature !== undefined
                                        ? `${displayData.item.data.maxTemperature.toFixed(1)}°C`
                                        : "k. A."}
                                </span>
                            </div>
                            <div style={styles.metricCell}>
                                <span style={styles.metricLabel}>Luft</span>
                                <span style={styles.metricValue}>
                                    {displayData.item.data.humidity !== undefined
                                        ? `${displayData.item.data.humidity.toFixed(0)}%`
                                        : "k. A."}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div style={comparisonStyle}>
                        <div style={styles.comparisonMessage}>
                            {displayData.anomalyDetails.comparisonMessage}
                        </div>
                        <span style={styles.anomaly}>
                            {displayData.anomalyDetails.anomalyMessage}
                        </span>
                    </div>
                </>
            )}
            {!(displayData && displayData.item && displayData.anomalyDetails) && (
                <>
                    <h2 style={{ ...nameStyle, ...placeholderStyle }}>Eine Stadt</h2>
                    <div style={{ ...subtitleStyle, ...placeholderStyle }}>
                        Wetterstation: Eine-Wetterstation (6km) 88.88.2025 19:20 Uhr
                    </div>

                    <div style={metricsStyle}>
                        <div style={styles.doubleCell}>
                            <div style={{ ...styles.metricCell, ...styles.metricCellHighlight }}>
                                <span style={styles.metricLabel}>{computedData.isToday ? "Zuletzt" : "Mittel"}</span>
                                <span style={{ ...styles.metricValue, ...placeholderStyle }}>
                                    20.5°C
                                </span>
                            </div>
                            <div style={styles.metricCell}>
                                <span style={styles.metricLabel}>Min</span>
                                <span style={{ ...styles.metricValue, ...placeholderStyle }}>
                                    14.1°C
                                </span>
                            </div>
                        </div>
                        <div style={styles.doubleCell}>
                            <div style={styles.metricCell}>
                                <span style={styles.metricLabel}>Max</span>
                                <span style={{ ...styles.metricValue, ...placeholderStyle }}>
                                    28.1°C
                                </span>
                            </div>
                            <div style={styles.metricCell}>
                                <span style={styles.metricLabel}>Luft</span>
                                <span style={{ ...styles.metricValue, ...placeholderStyle }}>
                                    64%
                                </span>
                            </div>
                        </div>
                    </div>

                    <div style={comparisonStyle}>
                        <div style={{ ...styles.comparisonMessage, ...placeholderStyle }}>
                            Absolut keine Ahnung
                        </div>
                        <div style={{ ...styles.anomaly, ...placeholderStyle }}>
                            Die maximale Temperatur liegt 3.1&nbsp;°C unter dem historischen&nbsp;Mittelwert.
                        </div>
                    </div>
                </>
            )}

        </div>
    );
};

export default StationDetails;