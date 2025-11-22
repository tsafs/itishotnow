import { useState, useEffect, useRef } from 'react';
import { analyzeTemperatureAnomaly } from '../../utils/TemperatureUtils.js';
import { useSelectedItem } from '../../store/hooks/hooks.js';
import type { SelectedItem } from '../../store/selectors/selectedItemSelectors.js';
import { CITY_SELECT_TIMEOUT } from '../../constants/page.js';
import './StationDetails.css';
import { useYearlyMeanByDayData } from '../../store/slices/YearlyMeanByDaySlice.js';
import { useReferenceYearlyHourlyInterpolatedByDayData } from '../../store/slices/ReferenceYearlyHourlyInterpolatedByDaySlice.js';
import { useSelectedDate } from '../../store/slices/selectedDateSlice.js';
import { getNow } from '../../utils/dateUtils.js';
import { DateTime } from 'luxon';
import { useAppSelector } from '../../store/hooks/useAppSelector.js';

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

    // If no city is selected, show a placeholder
    if (!selectedCityId) {
        return (
            <div className="station-info-panel">
                <div className="station-info-placeholder">
                    Klicke auf eine Stadt oder nutze die Suchfunktion um Details anzuzeigen
                </div>
            </div>
        );
    }

    return (
        <div className="station-info-panel">
            {item && (<h2 className="station-name">{item.city.name}</h2>)}
            {!item && (<h2 className="station-name-placeholder">Eine Stadt</h2>)}

            {subtitle && (
                <div className="station-subtitle" dangerouslySetInnerHTML={{ __html: subtitle }} />
            )}
            {!subtitle && (
                <div className="station-subtitle-placeholder">
                    Wetterstation: Eine-Wetterstation (6km) 88.88.2025 19:20 Uhr
                </div>
            )}

            <div className="station-metrics">
                <div className="metric-double-cell">
                    <div className="metric-cell metric-cell-highlight">
                        <span className="metric-label">{isToday ? "Zuletzt" : "Mittel"}</span>
                        {item && (
                            <span className="metric-value">
                                {item.data.temperature !== undefined
                                    ? `${item.data.temperature.toFixed(1)}°C`
                                    : "k. A."}
                            </span>
                        )}
                        {!item && (
                            <span className="metric-value-placeholder">
                                20.5°C
                            </span>
                        )}
                    </div>
                    <div className="metric-cell">
                        <span className="metric-label">Min</span>
                        {item && (
                            <span className="metric-value">
                                {item.data.minTemperature !== undefined
                                    ? `${item.data.minTemperature.toFixed(1)}°C`
                                    : "k. A."}
                            </span>
                        )}
                        {!item && (
                            <span className="metric-value-placeholder">
                                14.1°C
                            </span>
                        )}
                    </div>
                </div>
                <div className="metric-double-cell">
                    <div className="metric-cell">
                        <span className="metric-label">Max</span>
                        {item && (
                            <span className="metric-value">
                                {item.data.maxTemperature !== undefined
                                    ? `${item.data.maxTemperature.toFixed(1)}°C`
                                    : "k. A."}
                            </span>
                        )}
                        {!item && (
                            <span className="metric-value-placeholder">
                                28.1°C
                            </span>
                        )}
                    </div>
                    <div className="metric-cell">
                        <span className="metric-label">Luft</span>
                        {item && (
                            <span className="metric-value">
                                {item.data.humidity !== undefined
                                    ? `${item.data.humidity.toFixed(0)}%`
                                    : "k. A."}
                            </span>
                        )}
                        {!item && (
                            <span className="metric-value-placeholder">
                                64%
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="temperature-comparison">
                {!anomalyDetails && (
                    <>
                        <div className="message-placeholder">
                            Absolut keine Ahnung
                        </div>
                        <div className="anomaly-placeholder">
                            Die maximale Temperatur liegt 3.1&nbsp;°C unter dem historischen&nbsp;Mittelwert.
                        </div>
                    </>
                )}
                {anomalyDetails && (
                    <>
                        <div className="message">
                            {anomalyDetails.comparisonMessage}
                        </div>
                        <span className="anomaly">
                            {anomalyDetails.anomalyMessage}
                        </span>
                    </>
                )}
            </div>
        </div>
    );
};

export default StationDetails;