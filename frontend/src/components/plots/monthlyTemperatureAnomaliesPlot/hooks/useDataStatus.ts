import { useMemo } from "react";
import { useAppSelector } from '../../../../store/hooks/useAppSelector';
import {
    selectDataStatus as selectDailyHistoricalDataStatus,
    selectDataError as selectDailyHistoricalDataError
} from '../../iceAndHotDaysWavesPlot/slices/dataSlice';
import {
    selectDataStatus as selectHistoricalDataStatus,
    selectDataError as selectHistoricalDataError
} from '../../../../store/slices/historicalDataForStationSlice';

export const useDataStatus = () => {
    const status1 = useAppSelector(selectDailyHistoricalDataStatus);
    const error1 = useAppSelector(selectDailyHistoricalDataError);
    const status2 = useAppSelector(selectHistoricalDataStatus);
    const error2 = useAppSelector(selectHistoricalDataError);
    const isCityChanging = useAppSelector(state => state.selectedCity.isCityChanging);

    return useMemo(() => ({
        isLoading: isCityChanging || status1 === 'loading' || status2 === 'loading',
        error: error1 ?? error2 ?? null,
    }), [isCityChanging, error1, error2, status1, status2]);
};
