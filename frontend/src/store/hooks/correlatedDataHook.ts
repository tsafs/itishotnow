import { useMemo } from 'react';
import { useSelectedDate } from '../slices/selectedDateSlice.js';
import { useDailyRecentByDate } from '../slices/DailyRecentByDateSlice.js';
import { getNow } from '../../utils/dateUtils.js';
import StationData from '../../classes/StationData.js';
import City from '../../classes/City.js';
import Station from '../../classes/Station.js';
import type { StationDataJSON } from '../../classes/StationData.js';
import { DateTime } from 'luxon';
import { useAppSelector } from './useAppSelector.js';

export interface CorrelatedStationDataEntry {
    city: City;
    station: Station;
    data: StationData;
}

export type CorrelatedStationDataMap = Record<string, CorrelatedStationDataEntry>;

const toStationData = (json: StationDataJSON): StationData => StationData.fromJSON(json);

export const useCorrelatedData = (): CorrelatedStationDataMap | null => {
    const cityDataStatus = useAppSelector((state) => state.cityData.status);
    const cities = useAppSelector((state) => state.cityData.data);
    const liveDataResponse = useAppSelector((state) => state.liveData.data);
    const stations = liveDataResponse?.stations;
    const liveData = liveDataResponse?.stationData;
    const selectedDate = useSelectedDate();
    const selectedDateLuxon = DateTime.fromISO(selectedDate);
    const dailyRecentByDate = useDailyRecentByDate({
        year: selectedDateLuxon.year,
        month: selectedDateLuxon.month,
        day: selectedDateLuxon.day,
    });

    return useMemo(() => {
        if (cityDataStatus !== 'succeeded' || !cities || !stations || !selectedDate) {
            return null;
        }

        const selectedDateLuxonInner = DateTime.fromISO(selectedDate);
        const isToday = getNow().hasSame(selectedDateLuxonInner, 'day');

        if (isToday && !liveData) {
            return null;
        }
        if (!isToday && !dailyRecentByDate) {
            return null;
        }

        const correlatedData: CorrelatedStationDataMap = {};

        for (const [cityId, cityJSON] of Object.entries(cities)) {
            if (!cityJSON.stationId) {
                continue;
            }

            const stationJSON = stations?.[cityJSON.stationId];
            if (!stationJSON) {
                continue;
            }

            // Convert JSON to instances
            const city = City.fromJSON(cityJSON);
            const station = Station.fromJSON(stationJSON);

            let data: StationData | null = null;

            if (isToday) {
                const liveStationData = liveData?.[station.id];
                if (!liveStationData) {
                    continue;
                }
                data = toStationData(liveStationData);
            } else {
                const stationData = dailyRecentByDate?.[station.id];
                if (!stationData) {
                    continue;
                }
                data = new StationData(
                    station.id,
                    selectedDateLuxonInner.toFormat('yyyyLLdd'),
                    stationData.meanTemperature,
                    stationData.minTemperature,
                    stationData.maxTemperature,
                    stationData.meanHumidity,
                );
            }

            if (!data) {
                continue;
            }

            correlatedData[cityId] = {
                city,
                station,
                data,
            };
        }

        return Object.keys(correlatedData).length > 0 ? correlatedData : null;
    }, [cityDataStatus, cities, stations, liveData, dailyRecentByDate, selectedDate]);
};