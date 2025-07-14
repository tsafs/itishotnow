import { useMemo, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { analyzeTemperatureAnomaly } from '../../utils/TemperatureUtils';
import { selectHistoricalMean } from '../../store/slices/weatherStationDataSlice';
import './StationDetails.css';

/**
 * Panel component to display city information with nearest weather station data
 * @param {Object} props
 * @param {Object} props.selectedStation - Selected city/station data object
 */
const StationDetails = () => {
    const selectedCity = useSelector(state => state.selectedCity);
    const historicalMean = useSelector(state => selectHistoricalMean(state, selectedCity?.station_id));
    const [anomalyDetails, setAnomalyDetails] = useState(null);
    const [subtitle, setSubtitle] = useState('');

    // Extract anomaly from selected station
    useEffect(() => {
        if (!selectedCity || !selectedCity.nearestStation || !historicalMean) {
            setAnomalyDetails(null);
            setSubtitle('');
            return;
        }

        let difference = null;
        if (selectedCity.temperature !== undefined
            && historicalMean !== undefined
            && historicalMean !== null) {
            difference = selectedCity.temperature - historicalMean;
        }
        setAnomalyDetails(analyzeTemperatureAnomaly(difference));

        // Format the distance to show as km
        const formattedDistance = selectedCity.distanceToStation ?
            `(${Math.round(selectedCity.distanceToStation)}km)` : '';

        let subtitleText = '';
        if (selectedCity.nearestStation.station_name) {
            subtitleText = `Wetterstation: ${selectedCity.nearestStation.station_name} ${formattedDistance}`;
        }
        if (selectedCity.data_date) {
            subtitleText += ` ${selectedCity.data_date}\u00A0Uhr`;
        }
        setSubtitle(subtitleText);
    }, [selectedCity, historicalMean]);

    // If no city is selected, show a placeholder
    if (!selectedCity) {
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
            <h2 className="station-name">{selectedCity.city_name}</h2>

            {subtitle && (
                <div className="station-subtitle">
                    {subtitle}
                </div>
            )}

            <div className="station-metrics">
                <div className="metric-cell metric-cell-highlight">
                    <span className="metric-label">Zuletzt</span>
                    <span className="metric-value">
                        {selectedCity.temperature !== undefined
                            ? `${selectedCity.temperature.toFixed(1)}°C`
                            : "k. A."}
                    </span>
                </div>
                <div className="metric-cell">
                    <span className="metric-label">Min</span>
                    <span className="metric-value">
                        {selectedCity.min_temperature !== undefined
                            ? `${selectedCity.min_temperature.toFixed(1)}°C`
                            : "k. A."}
                    </span>
                </div>
                <div className="metric-cell">
                    <span className="metric-label">Max</span>
                    <span className="metric-value">
                        {selectedCity.max_temperature !== undefined
                            ? `${selectedCity.max_temperature.toFixed(1)}°C`
                            : "k. A."}
                    </span>
                </div>
                <div className="metric-cell">
                    <span className="metric-label">Luft</span>
                    <span className="metric-value">
                        {selectedCity.humidity !== undefined
                            ? `${selectedCity.humidity.toFixed(0)}%`
                            : "k. A."}
                    </span>
                </div>
            </div>

            {anomalyDetails && (
                <div className="temperature-comparison">
                    <div className="message">
                        {anomalyDetails.comparisonMessage}
                    </div>
                    <div className="anomaly">
                        {anomalyDetails.anomalyMessage}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StationDetails;