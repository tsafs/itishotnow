import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchIceAndHotDaysForStation, selectIceAndHotDaysForStationById } from '../slices/iceAndHotDaysForStationSlice';
import { useSelectedItem } from './selectedItemHook';

export const useIceAndHotDaysForSelectedStation = () => {
    const dispatch = useDispatch();
    const selectedItem = useSelectedItem();
    const stationId = selectedItem?.station?.id;

    const iceAndHotDays = useSelector(state =>
        stationId ? selectIceAndHotDaysForStationById(state, stationId) : null
    );

    useEffect(() => {
        if (stationId) {
            dispatch(fetchIceAndHotDaysForStation(stationId));
        }
    }, [dispatch, stationId]);

    return iceAndHotDays;
};
