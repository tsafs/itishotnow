import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { analyzeTemperatureAnomaly } from '../../utils/TemperatureUtils';
import { selectInterpolatedHourlyData } from '../../store/slices/interpolatedHourlyDataSlice';
import { extractHourFromDateString } from '../../utils/dataUtils';
import { useSelectedItem } from '../../store/hooks/selectedItemHook';
import { CITY_SELECT_TIMEOUT } from '../../constants/page';
import './StationDetails.css';

/**
 * Panel component to display city information with nearest weather station data
 * @param {Object} props
 * @param {Object} props.selectedStation - Selected city/station data object
 */
const StationDetails = () => {
    const selectedCityId = useSelector(state => state.selectedCity.cityId);
    const hourlyData = useSelector(selectInterpolatedHourlyData);
    const selectedItem = useSelectedItem();

    const [item, setItem] = useState(null);
    const [anomaly, setAnomaly] = useState(null);
    const [subtitle, setSubtitle] = useState('');
    const [anomalyDetails, setAnomalyDetails] = useState(null);

    // Get selected item
    useEffect(() => {
        if (!selectedItem) return;

        // Simulate loading delay
        setItem(null);
        setAnomaly(null);
        setSubtitle('');
        setAnomalyDetails(null);
        setTimeout(() => {
            setItem(selectedItem);
        }, CITY_SELECT_TIMEOUT);
    }, [selectedItem]);

    // Calculate anomaly
    useEffect(() => {
        if (!hourlyData || !item) return;

        const hour = extractHourFromDateString(item.data.date);
        if (!hour) return;

        const temperatureAtHour = hourlyData[item.station.id]?.hourlyTemps[`hour_${hour}`];
        if (temperatureAtHour === null || temperatureAtHour === undefined) return;

        const anomalyAtHour = Math.round((item.data.temperature - temperatureAtHour) * 10) / 10;
        setAnomaly(anomalyAtHour);
    }, [hourlyData, item]);

    // Calculate subtitle text
    useEffect(() => {
        if (!item) return;

        // Format the distance to show as km
        const formattedDistance = `(${Math.round(item.city.distanceToStation)}km)`;

        let subtitleText = '';
        if (item.station.name) {
            subtitleText = `Wetterstation: ${item.station.name} ${formattedDistance}`;
        }
        if (item.data.date) {
            subtitleText += ` ${item.data.date}\u00A0Uhr`;
        }
        setSubtitle(subtitleText);
    }, [item]);

    // Calculate comparison details using the utility function
    useEffect(() => {
        if (anomaly === null) return;
        setAnomalyDetails(analyzeTemperatureAnomaly(anomaly));
    }, [anomaly]);

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
                <div className="station-subtitle">
                    {subtitle}
                </div>
            )}
            {!subtitle && (
                <div className="station-subtitle-placeholder">
                    Wetterstation: Eine-Wetterstation (6km) 88.88.2025 19:20 Uhr
                </div>
            )}

            <div className="station-metrics">
                <div className="metric-cell metric-cell-highlight">
                    <span className="metric-label">Zuletzt</span>
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

            <div className="temperature-comparison">
                {!anomalyDetails && (
                    <>
                        <div className="message-placeholder">
                            Absolut keine Ahnung
                        </div>
                        <div className="anomaly-placeholder">
                            Die aktuelle Temperatur liegt 3.1&nbsp;°C unter dem historischen&nbsp;Mittelwert.
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