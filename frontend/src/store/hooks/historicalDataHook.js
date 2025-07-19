import { useSelector } from 'react-redux';
import { useMemo } from 'react';

export const useHistoricalData = () => {
    const historicalData = useSelector(state => state.historicalData.data);
    const status = useSelector(state => state.historicalData.status);

    return useMemo(() => {
        if (status !== 'succeeded') {
            return null;
        }
        if (!historicalData || historicalData.length === 0) {
            return null;
        }
        return historicalData;
    }, [historicalData, status]);
};