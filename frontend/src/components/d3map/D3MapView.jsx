import StationDetails from '../stationDetails/StationDetails';
import MapContainer from './MapContainer';
import ContentSplit from '../layout/ContentSplit';
import './D3MapView.css';

const D3MapView = () => {
    const leftContent = (
        <div className="left-content">
            <StationDetails />
        </div>
    );

    const rightContent = (
        <MapContainer />
    );

    return (
        <div className="d3-map-view">
            <ContentSplit
                leftContent={leftContent}
                rightContent={rightContent}
                className="map-content-split"
                leftRatio={45}
                rightRatio={55}
            />
        </div>
    );
};

export default D3MapView;
