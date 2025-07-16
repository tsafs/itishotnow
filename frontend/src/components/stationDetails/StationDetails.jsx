import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { analyzeTemperatureAnomaly } from '../../utils/TemperatureUtils';
import { selectCityMappedData } from '../../store/slices/cityDataSlice';
import { selectInterpolatedHourlyData } from '../../store/slices/interpolatedHourlyDataSlice';
import { extractHourFromDateString } from '../../utils/dataUtils';
import './StationDetails.css';

/**
 * Panel component to display city information with nearest weather station data
 * @param {Object} props
 * @param {Object} props.selectedStation - Selected city/station data object
 */
const StationDetails = () => {
    const mappedCities = useSelector(selectCityMappedData);
    const selectedCityId = useSelector(state => state.selectedCity.cityId);
    const hourlyData = useSelector(selectInterpolatedHourlyData);

    const [item, setItem] = useState(null);
    const [anomaly, setAnomaly] = useState(null);
    const [subtitle, setSubtitle] = useState('');
    const [anomalyDetails, setAnomalyDetails] = useState(null);

    // Get selected item
    useEffect(() => {
        if (!selectedCityId || !mappedCities) return;

        const item = mappedCities[selectedCityId];
        if (item === undefined) return;

        setItem(item);
        setSubtitle(null);
        setAnomaly(null);
        setAnomalyDetails(null);
    }, [selectedCityId, mappedCities]);

    // Calculate anomaly
    useEffect(() => {
        if (!hourlyData || !item) return;

        const hour = extractHourFromDateString(item.station.data_date);
        if (!hour) return;

        const temperatureAtHour = hourlyData[item.station.station_id]?.hourlyTemps[`hour_${hour}`];
        if (temperatureAtHour === null || temperatureAtHour === undefined) return;

        const anomalyAtHour = Math.round(item.station.temperature - temperatureAtHour);
        setAnomaly(anomalyAtHour);
    }, [hourlyData, item]);

    // Calculate subtitle text
    useEffect(() => {
        if (!item) return;

        // Format the distance to show as km
        const formattedDistance = `(${Math.round(item.distance)}km)`;

        let subtitleText = '';
        if (item.station.station_name) {
            subtitleText = `Wetterstation: ${item.station.station_name} ${formattedDistance}`;
        }
        if (item.station.data_date) {
            subtitleText += ` ${item.station.data_date}\u00A0Uhr`;
        }
        setSubtitle(subtitleText);
    }, [item]);

    // Calculate comparison details using the utility function
    useEffect(() => {
        if (!anomaly) return;
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
        <>
            {item && anomaly && subtitle && (
                <div className="station-info-panel">
                    <h2 className="station-name">{item.city.cityName}</h2>

                    {subtitle && (
                        <div className="station-subtitle">
                            {subtitle}
                        </div>
                    )}

                    <div className="station-metrics">
                        <div className="metric-cell metric-cell-highlight">
                            <span className="metric-label">Zuletzt</span>
                            <span className="metric-value">
                                {item.station.temperature !== undefined
                                    ? `${item.station.temperature.toFixed(1)}°C`
                                    : "k. A."}
                            </span>
                        </div>
                        <div className="metric-cell">
                            <span className="metric-label">Min</span>
                            <span className="metric-value">
                                {item.station.min_temperature !== undefined
                                    ? `${item.station.min_temperature.toFixed(1)}°C`
                                    : "k. A."}
                            </span>
                        </div>
                        <div className="metric-cell">
                            <span className="metric-label">Max</span>
                            <span className="metric-value">
                                {item.station.max_temperature !== undefined
                                    ? `${item.station.max_temperature.toFixed(1)}°C`
                                    : "k. A."}
                            </span>
                        </div>
                        <div className="metric-cell">
                            <span className="metric-label">Luft</span>
                            <span className="metric-value">
                                {item.station.humidity !== undefined
                                    ? `${item.station.humidity.toFixed(0)}%`
                                    : "k. A."}
                            </span>
                        </div>
                    </div>

                    <div className="temperature-comparison">
                        {!anomalyDetails && (
                            <div className="message">
                                Keine historischen Daten verfügbar.
                            </div>
                        )}
                        {anomalyDetails && (
                            <>
                                <div className="message">
                                    {anomalyDetails.comparisonMessage}
                                </div>
                                <div className="anomaly">
                                    {anomalyDetails.anomalyMessage}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default StationDetails;