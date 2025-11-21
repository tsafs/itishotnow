import { useMemo } from 'react';
import { useSelectedDate } from '../slices/selectedDateSlice.js';
import { useHistoricalDailyDataForStation } from '../slices/historicalDataForStationSlice.js';
import { getNow } from '../../utils/dateUtils.js';
import StationData from '../../classes/StationData.js';
import City from '../../classes/City.js';
import Station from '../../classes/Station.js';
import type { StationDataJSON } from '../../classes/StationData.js';
import { DateTime } from 'luxon';
import { useAppSelector } from './useAppSelector.js';

export interface SelectedItem {
    city: City;
    station: Station;
    data: StationData;
}

const fromLiveData = (json: StationDataJSON | undefined): StationData | null => {
    if (!json) {
        return null;
    }
    return StationData.fromJSON(json);
};

export const useSelectedItem = (): SelectedItem | null => {
    const cityDataStatus = useAppSelector((state) => state.cityData.status);
    const selectedCityId = useAppSelector((state) => state.selectedCity.cityId);
    const cities = useAppSelector((state) => state.cityData.data);
    const liveDataResponse = useAppSelector((state) => state.liveData.data);
    const stations = liveDataResponse?.stations;
    const liveData = liveDataResponse?.stationData;

    const selectedCityStationId = selectedCityId ? cities?.[selectedCityId]?.stationId ?? null : null;
    const historicalData = useHistoricalDailyDataForStation(selectedCityStationId);
    const selectedDate = useSelectedDate();

    return useMemo(() => {
        if (cityDataStatus !== 'succeeded' || !selectedCityId || !cities || !stations) {
            return null;
        }

        const city = cities[selectedCityId];
        if (!city || !city.stationId) {
            return null;
        }

        const station = stations[city.stationId];
        if (!station) {
            return null;
        }

        // Convert JSON to instances
        const cityInstance = City.fromJSON(city);
        const stationInstance = Station.fromJSON(station);

        const selectedDateLuxon = DateTime.fromISO(selectedDate);
        const isToday = getNow().hasSame(selectedDateLuxon, 'day');

        let data: StationData | null = null;

        if (isToday) {
            data = fromLiveData(liveData?.[stationInstance.id]);
            if (!data) {
                return null;
            }
        } else {
            if (!historicalData) {
                return null;
            }

            const selectedDateYYYYMMDD = selectedDateLuxon.toFormat('yyyyLLdd');
            const matchingEntry = historicalData[selectedDateYYYYMMDD];

            if (!matchingEntry) {
                return null;
            }

            data = new StationData(
                stationInstance.id,
                matchingEntry.date,
                matchingEntry.meanTemperature,
                matchingEntry.minTemperature,
                matchingEntry.maxTemperature,
                matchingEntry.meanHumidity,
            );
        }

        if (!data) {
            return null;
        }

        return {
            city: cityInstance,
            station: stationInstance,
            data,
        } satisfies SelectedItem;
    }, [cityDataStatus, selectedCityId, cities, stations, liveData, historicalData, selectedDate]);
};