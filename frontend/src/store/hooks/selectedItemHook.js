import { useSelector } from 'react-redux';
import { useMemo } from 'react';

export const useSelectedItem = () => {
    const areCitiesCorrelated = useSelector(state => state.cityData.areCitiesCorrelated);
    const selectedCityId = useSelector(state => state.selectedCity.cityId);
    const cities = useSelector(state => state.cityData.data);
    const stations = useSelector(state => state.stations.stations);
    const liveData = useSelector(state => state.liveData.data);

    return useMemo(() => {
        if (!areCitiesCorrelated || !selectedCityId || !cities || !stations || !liveData) {
            return null;    
        }
        const city = cities[selectedCityId];
        const station = stations[city.stationId];
        const data = liveData[city.stationId];

        if (!areCitiesCorrelated
            || !selectedCityId
            || !city
            || !station
            || !data) return null;

        return {
            city,
            station,
            data,
        };
    }, [areCitiesCorrelated, selectedCityId, cities, stations, liveData]);
};