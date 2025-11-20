import { useMemo } from 'react';
import { useSelectedDate } from '../slices/selectedDateSlice.js';
import { useHistoricalDailyDataForStation } from '../slices/historicalDataForStationSlice.js';
import { getNow } from '../../utils/dateUtils.js';
import StationData from '../../classes/StationData.js';
import type { StationDataJSON } from '../../classes/StationData.js';
import { DateTime } from 'luxon';
import { useAppSelector } from './useAppSelector.js';
import type { ICity } from '../../classes/City.js';
import type { StationJSON } from '../../classes/Station.js';

export interface SelectedItem {
    city: ICity;
    station: StationJSON;
    data: StationData;
}

const fromLiveData = (json: StationDataJSON | undefined): StationData | null => {
    if (!json) {
        return null;
    }
    return StationData.fromJSON(json);
};

export const useSelectedItem = (): SelectedItem | null => {
    const areCitiesCorrelated = useAppSelector((state) => state.cityData.areCitiesCorrelated);
    const selectedCityId = useAppSelector((state) => state.selectedCity.cityId);
    const cities = useAppSelector((state) => state.cityData.data);
    const stations = useAppSelector((state) => state.stations.stations);
    const liveData = useAppSelector((state) => state.liveData.data);

    const selectedCityStationId = selectedCityId ? cities?.[selectedCityId]?.stationId ?? null : null;
    const historicalData = useHistoricalDailyDataForStation(selectedCityStationId);
    const selectedDate = useSelectedDate();

    return useMemo(() => {
        if (!areCitiesCorrelated || !selectedCityId || !cities || !stations) {
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

        const selectedDateLuxon = DateTime.fromISO(selectedDate);
        const isToday = getNow().hasSame(selectedDateLuxon, 'day');

        let data: StationData | null = null;

        if (isToday) {
            data = fromLiveData(liveData?.[station.id]);
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
                station.id,
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
            city,
            station,
            data,
        } satisfies SelectedItem;
    }, [areCitiesCorrelated, selectedCityId, cities, stations, liveData, historicalData, selectedDate]);
};