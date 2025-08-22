import StationDetails from '../stationDetails/StationDetails.js';
import MapContainer from './MapContainer.js';
import ContentSplit from '../layout/ContentSplit.js';
import { PREDEFINED_CITIES } from '../../constants/map.js';
import { selectCity } from '../../store/slices/selectedCitySlice.js';
import './D3MapView.css';
import { updateDataByDate } from '../../store/slices/weatherStationDataSlice.js';
import { getNow } from '../../utils/dateUtils.js';
import { useAppSelector } from '../../store/hooks/useAppSelector.js';
import { useDispatch } from 'react-redux';
import { useEffect } from 'react';

const DEFAULT_CITY = "berlin"; // Default city to select

const D3MapView = () => {
    const dispatch = useDispatch();
    const cities = useAppSelector(state => state.cities);
    const selectedCity = useAppSelector(state => state.selectedCity);

    // Set default city when cities are loaded
    useEffect(() => {
        if (!selectedCity && cities.length > 0) {
            // Try to find the default city in the predefined list first
            const defaultCity = cities.find(city =>
                PREDEFINED_CITIES.includes(city.city_name) &&
                city.city_name.toLowerCase().includes(DEFAULT_CITY));

            if (defaultCity) {
                dispatch(selectCity(defaultCity, true));
                dispatch(updateDataByDate(defaultCity.station_id, getNow().toISOString()));
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
