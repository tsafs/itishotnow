import { useSelector } from 'react-redux';
import { useMemo } from 'react';

export const useCorrelatedData = () => {
    const areCitiesCorrelated = useSelector(state => state.cityData.areCitiesCorrelated);
    const cities = useSelector(state => state.cityData.data);
    const stations = useSelector(state => state.stations.stations);
    const liveData = useSelector(state => state.liveData.data);

    return useMemo(() => {
        if (!areCitiesCorrelated || !cities || !stations || !liveData) {
            return null;    
        }

        const correlatedData = {};
        for (const [cityId, city] of Object.entries(cities)) {
            const station = stations[city.stationId];
            const data = liveData[city.stationId];
            if (station && data) {
                correlatedData[cityId] = {
                    city,
                    station,
                    data,
                };
            }
        }
        return correlatedData;
    }, [areCitiesCorrelated, cities, stations, liveData]);
};