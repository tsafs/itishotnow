import { useState, useEffect, useRef, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { HEATMAP_INITIAL_DISPLAY_TIMEOUT } from '../../../constants/page.js';
import { theme, createStyles } from '../../../styles/design-system.js';
import { useBreakpointDown } from '../../../hooks/useBreakpoint.js';
import { useAppSelector } from '../../../store/hooks/useAppSelector.js';
import { useStationDetailsData } from './useStationDetailsData.js';
import type { StationDetailsData } from './useStationDetailsData.js';

const getPanelStyle = (isTablet: boolean): CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: isTablet ? 'center' : 'flex-end',
    maxWidth: 340,
    borderRight: isTablet ? 'none' : '1px solid #666',
    borderBottom: isTablet ? '1px solid #666' : 'none',
    padding: isTablet ? '0 20px 30px 20px' : '0 20px 0 0',
    marginTop: isTablet ? 20 : undefined,
    textAlign: isTablet ? 'center' : 'right',
    color: theme.colors.textLight,
});

const getMetricsStyle = (isTablet: boolean): CSSProperties => ({
    display: 'flex',
    flexDirection: 'row',
    gap: 10,
    justifyContent: isTablet ? 'center' : 'flex-end',
});

const getNameStyle = (isTablet: boolean): CSSProperties => ({
    margin: 0,
    fontSize: '1.6rem',
    fontWeight: 600,
    color: theme.colors.text,
    width: isTablet ? '100%' : undefined,
});

const getSubtitleStyle = (isTablet: boolean): CSSProperties => ({
    fontSize: '0.9rem',
    marginTop: 5,
    marginBottom: 30,
    maxWidth: 300,
    whiteSpaceCollapse: 'preserve' as any,
    textWrap: 'pretty' as any,
    width: isTablet ? '100%' : undefined,
});

const getComparisonStyle = (isTablet: boolean): CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: isTablet ? 'center' : 'flex-end',
    marginTop: 30,
    maxWidth: 300,
});

const placeholderStyle: CSSProperties = {
    backgroundColor: '#555',
    color: 'transparent',
    borderRadius: 4,
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
        backgroundColor: '#fefefe',
        borderRadius: 6,
        borderLeft: '4px solid rgb(7, 87, 156)',
        paddingLeft: 10,
        paddingRight: 10,
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
        color: theme.colors.text,
    },
    comparisonMessage: {
        fontSize: '1.4rem',
        fontWeight: 600,
        color: theme.colors.text,
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
    const isTablet = useBreakpointDown('tablet');

    // Get all computed data synchronously from custom hook
    const computedData = useStationDetailsData();

    // Track initial mount to show placeholders only on first load
    const isInitialMount = useRef<boolean>(true);

    // State for displayed data (used to delay updates on initial mount only)
    const [displayData, setDisplayData] = useState<StationDetailsData | null>(null);

    // Handle initial mount delay and subsequent immediate updates
    useEffect(() => {
        // If no data is ready, don't update (wait for all data to be available)
        if (!computedData.item || !computedData.subtitle || !computedData.anomalyDetails) {
            return;
        }

        // On initial mount, show placeholders with delay for better UX
        if (isInitialMount.current) {
            setTimeout(() => {
                setDisplayData(computedData);
                isInitialMount.current = false;
            }, HEATMAP_INITIAL_DISPLAY_TIMEOUT);
        } else {
            // After initial mount, update immediately and synchronously
            setDisplayData(computedData);
        }
    }, [computedData]);

    // Memoized computed styles
    const panelStyle = useMemo(() => getPanelStyle(isTablet), [isTablet]);
    const metricsStyle = useMemo(() => getMetricsStyle(isTablet), [isTablet]);
    const nameStyle = useMemo(() => getNameStyle(isTablet), [isTablet]);
    const subtitleStyle = useMemo(() => getSubtitleStyle(isTablet), [isTablet]);
    const comparisonStyle = useMemo(() => getComparisonStyle(isTablet), [isTablet]);

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
                                <span style={styles.metricValue}>
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