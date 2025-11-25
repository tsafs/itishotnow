import { useAppSelector } from './useAppSelector.js';
import { selectGeoJSONData, selectGeoJSONStatus } from '../slices/geoJsonSlice.js';
import {
    selectSelectedStationId,
    selectSelectedItem,
    selectSelectedCityName,
    selectSelectedStationName,
    selectSelectedStationData,
    type SelectedItem,
} from '../selectors/selectedItemSelectors.js';
import {
    selectSampledPlotData,
    selectCityLabelPlotData,
    type PlotDatum,
    type CityLabelDatum,
} from '../selectors/heatmapSelectors.js';

/**
 * Convenience hooks that wrap the granular selectors.
 * Uses useAppSelector to pass state to the memoized selectors created with createSelector.
 */

export const useSelectedCityName = () => useAppSelector(selectSelectedCityName);
export const useSelectedStationId = () => useAppSelector(selectSelectedStationId);
export const useSelectedStationName = () => useAppSelector(selectSelectedStationName);
export const useSelectedStationData = () => useAppSelector(selectSelectedStationData);
export const useSelectedItem = () => useAppSelector(selectSelectedItem);
export const useSampledPlotData = () => useAppSelector(selectSampledPlotData);
export const useCityLabelPlotData = () => useAppSelector(selectCityLabelPlotData) as CityLabelDatum[] | null;
export const useGeoJSON = () => useAppSelector(selectGeoJSONData);
export const useGeoJSONStatus = () => useAppSelector(selectGeoJSONStatus);

// Re-export types
export type { SelectedItem, PlotDatum, CityLabelDatum };
