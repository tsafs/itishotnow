import { useMemo } from 'react';
import { useSelectedDate } from '../slices/selectedDateSlice.js';
import { useDailyRecentByDate } from '../slices/DailyRecentByDateSlice.js';
import { getNow } from '../../utils/dateUtils.js';
import StationData from '../../classes/StationData.js';
import type { StationDataJSON } from '../../classes/StationData.js';
import { DateTime } from 'luxon';
import { useAppSelector } from './useAppSelector.js';
import type { ICity } from '../../classes/City.js';
import type { StationJSON } from '../../classes/Station.js';

export interface CorrelatedStationDataEntry {
    city: ICity;
    station: StationJSON;
    data: StationData;
}

export type CorrelatedStationDataMap = Record<string, CorrelatedStationDataEntry>;

const toStationData = (json: StationDataJSON): StationData => StationData.fromJSON(json);

export const useCorrelatedData = (): CorrelatedStationDataMap | null => {
    const areCitiesCorrelated = useAppSelector((state) => state.cityData.areCitiesCorrelated);
    const cities = useAppSelector((state) => state.cityData.data);
    const stations = useAppSelector((state) => state.stations.stations);
    const liveData = useAppSelector((state) => state.liveData.data);
    const selectedDate = useSelectedDate();
    const selectedDateLuxon = DateTime.fromISO(selectedDate);
    const dailyRecentByDate = useDailyRecentByDate({
        year: selectedDateLuxon.year,
        month: selectedDateLuxon.month,
        day: selectedDateLuxon.day,
    });

    return useMemo(() => {
        if (!areCitiesCorrelated || !cities || !stations || !selectedDate) {
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

        for (const [cityId, city] of Object.entries(cities)) {
            if (!city.stationId) {
                continue;
            }

            const station = stations?.[city.stationId];
            if (!station) {
                continue;
            }

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
    }, [areCitiesCorrelated, cities, stations, liveData, dailyRecentByDate, selectedDate]);
};