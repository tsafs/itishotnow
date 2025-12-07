import { useMemo } from "react";
import { useAppSelector } from "../../../../store/hooks/useAppSelector";
import { selectDataError, selectDataStatus } from "../../../../store/slices/dailyHistoricalStationDataSlice";

export const useDataStatus = () => {
    const status = useAppSelector(selectDataStatus);
    const error = useAppSelector(selectDataError);
    const isCityChanging = useAppSelector(state => state.selectedCity.isCityChanging);

    return useMemo(() => ({
        isLoading: isCityChanging || status === 'loading',
        error: error ?? null,
    }), [isCityChanging, error, status]);
};