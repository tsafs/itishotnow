import { useState, useEffect, useRef, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { analyzeTemperatureAnomaly } from '../../utils/TemperatureUtils.js';
import { useSelectedItem } from '../../store/hooks/hooks.js';
import type { SelectedItem } from '../../store/selectors/selectedItemSelectors.js';
import { CITY_SELECT_TIMEOUT } from '../../constants/page.js';
import { theme, createStyles } from '../../styles/design-system.js';
import { useBreakpointDown } from '../../hooks/useBreakpoint.js';
import { useYearlyMeanByDayData } from '../../store/slices/YearlyMeanByDaySlice.js';
import { useReferenceYearlyHourlyInterpolatedByDayData } from '../../store/slices/ReferenceYearlyHourlyInterpolatedByDaySlice.js';
import { useSelectedDate } from '../../store/slices/selectedDateSlice.js';
import { getNow } from '../../utils/dateUtils.js';
import { DateTime } from 'luxon';
import { useAppSelector } from '../../store/hooks/useAppSelector.js';

const getPanelStyle = (isMobile: boolean): CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: isMobile ? 'center' : 'flex-end',
    maxWidth: 340,
    borderRight: isMobile ? 'none' : '1px solid #666',
    borderBottom: isMobile ? '1px solid #666' : 'none',
    padding: isMobile ? '0 20px 30px 20px' : '0 20px 0 0',
    marginTop: isMobile ? 20 : undefined,
});

const getMetricsStyle = (isMobile: boolean): CSSProperties => ({
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: isMobile ? 'center' : 'flex-end',
});

const getNameStyle = (isMobile: boolean): CSSProperties => ({
    margin: 0,
    fontSize: '1.6rem',
    fontWeight: 600,
    color: theme.colors.text,
    textAlign: isMobile ? 'center' : undefined,
    width: isMobile ? '100%' : undefined,
});

const getSubtitleStyle = (isMobile: boolean): CSSProperties => ({
    fontSize: '0.9rem',
    marginTop: 5,
    marginBottom: 30,
    maxWidth: 300,
    whiteSpaceCollapse: 'preserve' as any,
    textWrap: 'pretty' as any,
    textAlign: isMobile ? 'center' : undefined,
    width: isMobile ? '100%' : undefined,
});

const getComparisonStyle = (isMobile: boolean): CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: isMobile ? 'center' : 'flex-end',
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

interface AnomalyDetails {
    comparisonMessage: string;
    anomalyMessage: string;
}

/**
 * Panel component to display city information with nearest weather station data
 */
const StationDetails = () => {
    const selectedCityId = useAppSelector((state) => state.selectedCity.cityId);
    const yearlyMeanByDayData = useYearlyMeanByDayData();
    const referenceYearlyHourlyInterpolatedByDayData = useReferenceYearlyHourlyInterpolatedByDayData();
    const selectedItem = useSelectedItem();
    const selectedDate = useSelectedDate();
    const isMobile = useBreakpointDown('mobile');

    const [item, setItem] = useState<SelectedItem | null>(null);
    const [anomaly, setAnomaly] = useState<number | null>(null);
    const [subtitle, setSubtitle] = useState<string>('');
    const [anomalyDetails, setAnomalyDetails] = useState<AnomalyDetails | null>(null);

    const prevItemRef = useRef<SelectedItem | null>(null);

    const isToday = DateTime.fromISO(selectedDate).hasSame(getNow(), 'day');

    // Get selected data with loading delay
    useEffect(() => {
        // If no data is available, reset state
        if (!selectedItem) {
            setItem(null);
            setAnomaly(null);
            setSubtitle('');
            setAnomalyDetails(null);
            return;
        }

        // If nothing has changed, do nothing
        if (prevItemRef.current === selectedItem) return;

        // Simulate loading delay
        setItem(null);
        setAnomaly(null);
        setSubtitle('');
        setAnomalyDetails(null);
        setTimeout(() => {
            setItem(selectedItem);
            prevItemRef.current = selectedItem;
        }, CITY_SELECT_TIMEOUT);
    }, [selectedItem]);

    // Calculate anomaly
    useEffect(() => {
        if (!item) return;

        const luxonDate = DateTime.fromISO(selectedDate);
        const isToday = luxonDate.hasSame(getNow(), 'day');

        if (isToday) {
            if (!referenceYearlyHourlyInterpolatedByDayData) return;

            const { data, month, day } = referenceYearlyHourlyInterpolatedByDayData;
            if (!data || month !== luxonDate.month || day !== luxonDate.day) return;

            const hourlyData = data[item.station.id];
            if (!hourlyData) return;

            const hour = DateTime.fromFormat(item.data.date, 'dd.MM.yyyy HH:mm', { zone: 'Europe/Berlin' }).hour;
            const currentTemperature = item.data.temperature ?? null;
            if (!currentTemperature) return;

            const referenceTemperature = hourlyData[`hour_${hour}`];

            if (referenceTemperature === undefined || referenceTemperature === null) return;

            const anomalyValue = Math.round((currentTemperature - referenceTemperature) * 10) / 10;
            setAnomaly(anomalyValue);
        } else {
            if (!yearlyMeanByDayData || Object.keys(yearlyMeanByDayData).length === 0) return;

            const maxTemperature = yearlyMeanByDayData[item.station.id]?.tasmax;
            if (maxTemperature === undefined || maxTemperature === null) return;
            if (!item.data.maxTemperature) return;

            const maxAnomaly = Math.round((item.data.maxTemperature - maxTemperature) * 10) / 10;
            setAnomaly(maxAnomaly);
        }
    }, [yearlyMeanByDayData, item, selectedDate, referenceYearlyHourlyInterpolatedByDayData]);

    // Calculate subtitle text
    useEffect(() => {
        if (!item) return;
        // Format the distance to show as km when available
        const distance = item.city.distanceToStation;
        const formattedDistance = distance != null ? `(${Math.round(distance)}km)` : '';

        let subtitleText = '';
        if (item.station.name) {
            const distanceLabel = formattedDistance ? ` ${formattedDistance}` : '';
            subtitleText = `Wetterstation: <span class="nowrap">${item.station.name}${distanceLabel}</span>`;
        }
        if (item.data.date) {
            // Use Luxon for all date parsing and formatting
            const now = getNow();
            let date;
            let isToday = false;

            // selectedDate is a string, parse with Luxon
            const selectedDateLuxon = DateTime.fromISO(selectedDate);
            isToday = selectedDateLuxon.hasSame(now, 'day');

            if (isToday) {
                // Convert "20.07.2025 18:20" -> "2025-07-20T18:20"
                date = DateTime.fromFormat(item.data.date, 'dd.MM.yyyy HH:mm', { zone: 'Europe/Berlin' });
            } else {
                // Convert "20250720" -> "2025-07-20"
                date = DateTime.fromFormat(item.data.date, 'yyyyMMdd', { zone: 'Europe/Berlin' });
            }

            if (date && date.isValid) {
                if (isToday) {
                    subtitleText += ` <span class="nowrap">${date.toLocaleString({
                        ...DateTime.DATE_FULL,
                        hour: '2-digit',
                        minute: '2-digit'
                    })} Uhr</span>`;
                } else {
                    subtitleText += ` <span class="nowrap">${date.toLocaleString(DateTime.DATE_FULL)}</span>`;
                }
            }
        }

        setSubtitle(subtitleText);
    }, [item, selectedDate]);

    // Calculate comparison details using the utility function
    useEffect(() => {
        if (anomaly === null) return;
        // Use Luxon for date comparison
        const now = getNow();
        const selectedDateLuxon = DateTime.fromISO(selectedDate);
        const isToday = selectedDateLuxon.hasSame(now, 'day');
        setAnomalyDetails(analyzeTemperatureAnomaly(isToday, anomaly));
    }, [anomaly, selectedDate]);

    // Memoized computed styles
    const panelStyle = useMemo(() => getPanelStyle(isMobile), [isMobile]);
    const metricsStyle = useMemo(() => getMetricsStyle(isMobile), [isMobile]);
    const nameStyle = useMemo(() => getNameStyle(isMobile), [isMobile]);
    const subtitleStyle = useMemo(() => getSubtitleStyle(isMobile), [isMobile]);
    const comparisonStyle = useMemo(() => getComparisonStyle(isMobile), [isMobile]);

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
            {item && (<h2 style={nameStyle}>{item.city.name}</h2>)}
            {!item && (<h2 style={{ ...nameStyle, ...placeholderStyle }}>Eine Stadt</h2>)}

            {subtitle && (
                <div style={subtitleStyle} dangerouslySetInnerHTML={{ __html: subtitle }} />
            )}
            {!subtitle && (
                <div style={{ ...subtitleStyle, ...placeholderStyle }}>
                    Wetterstation: Eine-Wetterstation (6km) 88.88.2025 19:20 Uhr
                </div>
            )}

            <div style={metricsStyle}>
                <div style={styles.doubleCell}>
                    <div style={{ ...styles.metricCell, ...styles.metricCellHighlight }}>
                        <span style={styles.metricLabel}>{isToday ? "Zuletzt" : "Mittel"}</span>
                        {item && (
                            <span style={styles.metricValue}>
                                {item.data.temperature !== undefined
                                    ? `${item.data.temperature.toFixed(1)}°C`
                                    : "k. A."}
                            </span>
                        )}
                        {!item && (
                            <span style={{ ...styles.metricValue, ...placeholderStyle }}>
                                20.5°C
                            </span>
                        )}
                    </div>
                    <div style={styles.metricCell}>
                        <span style={styles.metricLabel}>Min</span>
                        {item && (
                            <span style={styles.metricValue}>
                                {item.data.minTemperature !== undefined
                                    ? `${item.data.minTemperature.toFixed(1)}°C`
                                    : "k. A."}
                            </span>
                        )}
                        {!item && (
                            <span style={{ ...styles.metricValue, ...placeholderStyle }}>
                                14.1°C
                            </span>
                        )}
                    </div>
                </div>
                <div style={styles.doubleCell}>
                    <div style={styles.metricCell}>
                        <span style={styles.metricLabel}>Max</span>
                        {item && (
                            <span style={styles.metricValue}>
                                {item.data.maxTemperature !== undefined
                                    ? `${item.data.maxTemperature.toFixed(1)}°C`
                                    : "k. A."}
                            </span>
                        )}
                        {!item && (
                            <span style={{ ...styles.metricValue, ...placeholderStyle }}>
                                28.1°C
                            </span>
                        )}
                    </div>
                    <div style={styles.metricCell}>
                        <span style={styles.metricLabel}>Luft</span>
                        {item && (
                            <span style={styles.metricValue}>
                                {item.data.humidity !== undefined
                                    ? `${item.data.humidity.toFixed(0)}%`
                                    : "k. A."}
                            </span>
                        )}
                        {!item && (
                            <span style={{ ...styles.metricValue, ...placeholderStyle }}>
                                64%
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div style={comparisonStyle}>
                {!anomalyDetails && (
                    <>
                        <div style={{ ...styles.comparisonMessage, ...placeholderStyle }}>
                            Absolut keine Ahnung
                        </div>
                        <div style={{ ...styles.anomaly, ...placeholderStyle }}>
                            Die maximale Temperatur liegt 3.1&nbsp;°C unter dem historischen&nbsp;Mittelwert.
                        </div>
                    </>
                )}
                {anomalyDetails && (
                    <>
                        <div style={styles.comparisonMessage}>
                            {anomalyDetails.comparisonMessage}
                        </div>
                        <span style={styles.anomaly}>
                            {anomalyDetails.anomalyMessage}
                        </span>
                    </>
                )}
            </div>
        </div>
    );
};

export default StationDetails;