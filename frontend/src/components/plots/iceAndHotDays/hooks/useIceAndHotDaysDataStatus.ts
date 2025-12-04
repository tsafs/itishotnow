import { useMemo } from "react";
import { useAppSelector } from "../../../../store/hooks/useAppSelector";
import { selectIceAndHotDaysDataError, selectIceAndHotDaysDataStatus } from "../../../../store/slices/iceAndHotDaysDataSlice";

export const useIceAndHotDaysDataStatus = () => {
    const status = useAppSelector(selectIceAndHotDaysDataStatus);
    const error = useAppSelector(selectIceAndHotDaysDataError);
    const isCityChanging = useAppSelector(state => state.selectedCity.isCityChanging);

    return useMemo(() => ({
        isLoading: isCityChanging || status === 'loading',
        error: error ?? null,
    }), [isCityChanging, error, status]);
};