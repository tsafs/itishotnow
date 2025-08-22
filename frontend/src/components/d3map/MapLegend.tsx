import { getAnomalyColor } from '../../utils/TemperatureUtils.js';
import './MapLegend.css';

const MapLegend = ({ title, colorScheme }) => {
    // Create an array from -10 to +10 with steps of 2
    const anomalyValues = Array.from({ length: 11 }, (_, i) => (i * 2) - 10);

    return (
        <div className="map-legend">
            {title && (
                <div className="map-legend-title">
                    {title}
                </div>
            )}
            <div className="map-legend-colors">
                {anomalyValues.map(value => (
                    <div
                        key={`color-${value}`}
                        className="map-legend-color-box"
                        style={{ backgroundColor: getAnomalyColor(value, colorScheme) }}
                    />
                ))}
            </div>

            <div className="map-legend-labels">
                {anomalyValues.map(value => (
                    <div
                        key={`label-${value}`}
                        className="map-legend-label"
                    >
                        {value}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MapLegend;
