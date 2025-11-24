import { useAppSelector } from './useAppSelector.js';
import { selectGeoJSONData, selectGeoJSONStatus } from '../slices/geoJsonSlice.js';
import {
    selectSelectedCityId,
    selectSelectedStationId,
    selectSelectedItem,
    selectSelectedCityName,
    selectSelectedStationName,
    selectSelectedStationData,
    selectSelectedCity,
    selectSelectedStation,
    type SelectedItem,
} from '../selectors/selectedItemSelectors.js';
import {
    selectCorrelatedData,
    selectPlotDataWithAnomalies,
    type CorrelatedStationDataMap,
    type PlotDatum,
} from '../selectors/correlatedDataSelectors.js';

/**
 * Convenience hooks that wrap the granular selectors.
 * Uses useAppSelector to pass state to the memoized selectors created with createSelector.
 */

export const useSelectedCityId = () => useAppSelector(selectSelectedCityId);
export const useSelectedCityName = () => useAppSelector(selectSelectedCityName);
export const useSelectedStationId = () => useAppSelector(selectSelectedStationId);
export const useSelectedStationName = () => useAppSelector(selectSelectedStationName);
export const useSelectedStationData = () => useAppSelector(selectSelectedStationData);
export const useSelectedCity = () => useAppSelector(selectSelectedCity);
export const useSelectedStation = () => useAppSelector(selectSelectedStation);
export const useSelectedItem = () => useAppSelector(selectSelectedItem);
export const useCorrelatedData = () => useAppSelector(selectCorrelatedData);
export const usePlotDataWithAnomalies = () => useAppSelector(selectPlotDataWithAnomalies);
export const useGeoJSON = () => useAppSelector(selectGeoJSONData);
export const useGeoJSONStatus = () => useAppSelector(selectGeoJSONStatus);

// Re-export types
export type { SelectedItem, CorrelatedStationDataMap, PlotDatum };
