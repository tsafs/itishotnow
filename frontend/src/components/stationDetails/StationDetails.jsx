import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { analyzeTemperatureAnomaly } from '../../utils/TemperatureUtils';
import { selectHistoricalMean, selectCurrentClimateData } from '../../store/slices/weatherStationDataSlice';
import './StationDetails.css';

/**
 * Panel component to display city information with nearest weather station data
 */
const StationDetails = () => {
    const selectedCity = useSelector(state => state.selectedCity);
    const selectedData = useSelector(selectCurrentClimateData);
    const historicalMean = useSelector(state =>
        selectedCity?.station_id ? selectHistoricalMean(state, selectedCity.station_id) : null
    );
    const [anomalyDetails, setAnomalyDetails] = useState(null);
    const [subtitle, setSubtitle] = useState('');
    const [climateData, setClimateData] = useState({});

    // This will be our climate data from either live or historical source
    useEffect(() => {
        if (selectedData && selectedData.data) {
            console.log(selectedData.type);
            let data = {};
            if (selectedData.type === 'live') {
                data = {
                    date: selectedData.data.data_date,
                    temperature: selectedData.data.temperature,
                    min_temperature: selectedData.data.min_temperature,
                    max_temperature: selectedData.data.max_temperature,
                    humidity: selectedData.data.humidity
                };
            } else {
                // Convert YYYYMMDD to YYYY.MM.DD
                const formattedDate = selectedData.data.date.replace(
                    /(\d{4})(\d{2})(\d{2})/,
                    '$3.$2.$1'
                );

                data = {
                    date: formattedDate,
                    temperature: selectedData.data.mean_temperature,
                    min_temperature: selectedData.data.min_temperature,
                    max_temperature: selectedData.data.max_temperature,
                    humidity: selectedData.data.mean_humidity
                };
            }
            console.log(`Climate data updated: ${JSON.stringify(data)}`);
            setClimateData(data);
        } else {
            setClimateData({});
        }
    }, [selectedData]);

    // Calculate anomaly when climate data or historical mean changes
    useEffect(() => {
        if (climateData.temperature === undefined || historicalMean === undefined) {
            setAnomalyDetails(null);
            return;
        }
        setAnomalyDetails(analyzeTemperatureAnomaly(selectedData.type === "live", climateData.temperature - historicalMean));
    }, [selectedData, climateData, historicalMean]);

    // Update subtitle based on selected city and data type
    useEffect(() => {
        if (!selectedCity) {
            setSubtitle('');
            return;
        }

        // Format the distance to show as km
        const formattedDistance = selectedCity.distanceToStation ?
            `(${Math.round(selectedCity.distanceToStation)}km)` : '';

        let subtitleText = '';

        // Add station name if available
        if (selectedCity.nearestStation?.station_name) {
            subtitleText = `Wetterstation: ${selectedCity.nearestStation.station_name} ${formattedDistance}`;
        }

        // Add date/time information
        if (climateData.date) {
            if (selectedData?.type === "live") {
                subtitleText += ` ${climateData.date}\u00A0Uhr`;
            } else if (selectedData?.type === "historical") {
                subtitleText += ` ${climateData.date}`;
            }
        }

        setSubtitle(subtitleText);
    }, [selectedCity, selectedData, climateData]);

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
                    <span className="metric-label">
                        {selectedData.type === "live" ? "Zuletzt" : "Mittel"}
                    </span>
                    <span className="metric-value">
                        {climateData.temperature !== undefined
                            ? `${climateData.temperature.toFixed(1)}°C`
                            : "k. A."}
                    </span>
                </div>
                <div className="metric-cell">
                    <span className="metric-label">Min</span>
                    <span className="metric-value">
                        {climateData.min_temperature !== undefined
                            ? `${climateData.min_temperature.toFixed(1)}°C`
                            : "k. A."}
                    </span>
                </div>
                <div className="metric-cell">
                    <span className="metric-label">Max</span>
                    <span className="metric-value">
                        {climateData.max_temperature !== undefined
                            ? `${climateData.max_temperature.toFixed(1)}°C`
                            : "k. A."}
                    </span>
                </div>
                <div className="metric-cell">
                    <span className="metric-label">Luft</span>
                    <span className="metric-value">
                        {climateData.humidity !== undefined
                            ? `${climateData.humidity.toFixed(0)}%`
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