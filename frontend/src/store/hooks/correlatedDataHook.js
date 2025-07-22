import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { useSelectedDate } from '../slices/selectedDateSlice';
import { useHistoricalData } from '../slices/historicalDataSlice';
import { getNow } from '../../utils/dateUtils';
import StationData from '../../classes/StationData';
import { DateTime } from 'luxon';

export const useCorrelatedData = () => {
    const areCitiesCorrelated = useSelector(state => state.cityData.areCitiesCorrelated);
    const cities = useSelector(state => state.cityData.data);
    const stations = useSelector(state => state.stations.stations);
    const liveData = useSelector(state => state.liveData.data);
    const selectedDate = useSelectedDate();
    const selectedDateLuxon = DateTime.fromISO(selectedDate);
    const historicalData = useHistoricalData(selectedDateLuxon.month, selectedDateLuxon.day);

    return useMemo(() => {
        if (!areCitiesCorrelated || !cities || !stations || !selectedDate) {
            return null;
        }

        const selectedDateLuxon = DateTime.fromISO(selectedDate);
        const isToday = getNow().hasSame(selectedDateLuxon, 'day');

        if (isToday && !liveData) {
            return null; // No live data available
        } else if (!isToday && !historicalData) {
            return null; // No historical data available
        }

        const correlatedData = {};
        for (const [cityId, city] of Object.entries(cities)) {
            const station = stations[city.stationId];
            if (!station) {
                continue;
            }

            let data = null;
            if (isToday) {
                if (!liveData[station.id]) {
                    continue;
                }
                data = liveData[station.id];
            } else {
                if (!historicalData[station.id]) {
                    continue;
                }
                const historicalDataForStation = historicalData[station.id];
                data = new StationData(
                    station.id,
                    selectedDateLuxon.toFormat('MMdd'),
                    historicalDataForStation.tas,
                    historicalDataForStation.tasmin,
                    historicalDataForStation.tasmax,
                    null,
                );
            }

            correlatedData[cityId] = {
                city,
                station,
                data,
            };
        }
        return correlatedData;
    }, [areCitiesCorrelated, cities, stations, liveData, historicalData, selectedDate]);
};