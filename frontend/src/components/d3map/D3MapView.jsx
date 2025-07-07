import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import StationDetails from '../stationDetails/StationDetails';
import MapContainer from './MapContainer';
import ContentSplit from '../layout/ContentSplit';
import { PREDEFINED_CITIES } from '../../constants/map';
import { selectCity } from '../../store/slices/rememberedCitiesSlice';
import './D3MapView.css';

const DEFAULT_CITY = "berlin"; // Default city to select

const D3MapView = () => {
    const dispatch = useDispatch();
    const cities = useSelector(state => state.cities);
    const selectedCity = useSelector(state => state.selectedCity);

    // Set default city when cities are loaded
    useEffect(() => {
        if (!selectedCity && cities.length > 0) {
            // Try to find the default city in the predefined list first
            const defaultCity = cities.find(city =>
                PREDEFINED_CITIES.includes(city.city_name) &&
                city.city_name.toLowerCase().includes(DEFAULT_CITY));

            if (defaultCity) {
                dispatch(selectCity(defaultCity, true));
            }
        }
    }, [cities, selectedCity, dispatch]);

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
