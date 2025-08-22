import EuropeMap from './EuropeMap.js';
import StationMarkers from './StationMarkers.js';
import MapLegend from './MapLegend.js';
import { MAP_DIMENSIONS } from '../../constants/map.js';
import './MapContainer.css';

const MapContainer = () => {

    return (
        <div className="d3-map-container">
            <svg
                className="d3-map"
                width={MAP_DIMENSIONS.width}
                height={MAP_DIMENSIONS.height}
                viewBox={`0 0 ${MAP_DIMENSIONS.width} ${MAP_DIMENSIONS.height}`}
                preserveAspectRatio="xMidYMid meet"
                overflow={"hidden"}
            >
                {/* Map of Europe with countries */}
                <EuropeMap />

                {/* City markers with nearest weather station data */}
                <StationMarkers />
            </svg>
            <MapLegend />
        </div>
    );
};

export default MapContainer;
