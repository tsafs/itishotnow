import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { useSelectedDate } from '../slices/selectedDateSlice';
import { useHistoricalDailyDataForStation } from '../slices/historicalDataForStationSlice';
import { getNow } from '../../utils/dateUtils';
import StationData from '../../classes/StationData';
import { DateTime } from 'luxon';

export const useSelectedItem = () => {
    const areCitiesCorrelated = useSelector(state => state.cityData.areCitiesCorrelated);
    const selectedCityId = useSelector(state => state.selectedCity.cityId);
    const cities = useSelector(state => state.cityData.data);
    const stations = useSelector(state => state.stations.stations);
    const liveData = useSelector(state => state.liveData.data);
    const selectedStationId = stations?.[cities?.[selectedCityId]?.stationId]?.id;
    const historicalData = useHistoricalDailyDataForStation(selectedStationId);
    const selectedDate = useSelectedDate();

    return useMemo(() => {
        if (!areCitiesCorrelated || !selectedCityId || !cities || !stations) {
            return null;
        }
        const city = cities[selectedCityId];
        const station = stations[city.stationId];
        // Use Luxon for date parsing and comparison
        const selectedDateLuxon = DateTime.fromISO(selectedDate);

        let data = null;

        const isToday = getNow().hasSame(selectedDateLuxon, 'day');
        if (isToday) {
            if (!liveData || !liveData[station.id]) {
                return null; // No live data available
            }
            data = liveData[station.id];
        } else {
            if (!historicalData) {
                return null; // No historical data available
            }
            // Search for date in historicalData{} keys in reverse order
            const selectedDateYYYYMMDD = selectedDateLuxon.toFormat('yyyyLLdd');
            const historicalDataKeys = Object.entries(historicalData).reverse();
            const item = historicalDataKeys.find(([_, value]) => {
                if (value.date === selectedDateYYYYMMDD) return true;
                return false;
            })?.[1];
            if (!item) return null;
            data = new StationData(
                station.id,
                item.date,
                item.meanTemperature,
                item.minTemperature,
                item.maxTemperature,
                item.meanHumidity,
            );
        }

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
    }, [areCitiesCorrelated, selectedCityId, cities, stations, liveData, historicalData, selectedDate]);
};