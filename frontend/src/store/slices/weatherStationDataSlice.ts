import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { AppThunk, RootState } from '../index.js';
import type { IStationData, IStationDataByDate } from '../../classes/DailyRecentByStation.js';
import type { IDateRange } from '../../classes/DateRange.js';
import type { StationJSON } from '../../classes/Station.js';
import type { StationDataJSON } from '../../classes/StationData.js';
import { fetchLiveData as fetchLiveDataService } from '../../services/LiveDataService.js';
import type { LiveDataResponse } from '../../services/LiveDataService.js';
import { fetchDailyWeatherStationData } from '../../services/HistoricalDataForStationService.js';

export interface LatestStationWeather {
    station: StationJSON;
    measurement: StationDataJSON;
}

interface HistoricalMeanRecord {
    hist_mean_1961_1990?: number | null;
}

interface LatestDataState {
    loading: boolean;
    error: string | null;
    data: Record<string, LatestStationWeather>;
}

interface HistoricalDataState {
    loading: boolean;
    error: string | null;
    data: IStationDataByDate | null;
    stationId: string | null;
}

export interface SelectedClimateData {
    data: StationDataJSON | IStationData;
    type: 'live' | 'historical';
    stationId: string;
}

export interface WeatherStationDataState {
    latestData: LatestDataState;
    historicalData: HistoricalDataState;
    selectedData: SelectedClimateData | null;
    historicalMeans: Record<string, HistoricalMeanRecord>;
    availableDates: Record<string, IDateRange>;
}

const initialState: WeatherStationDataState = {
    latestData: {
        loading: false,
        error: null,
        data: {},
    },
    historicalData: {
        loading: false,
        error: null,
        data: null,
        stationId: null,
    },
    selectedData: null,
    historicalMeans: {},
    availableDates: {},
};

const weatherStationDataSlice = createSlice({
    name: 'weatherStationData',
    initialState,
    reducers: {
        fetchLatestDataStart: (state) => {
            state.latestData.loading = true;
            state.latestData.error = null;
        },
        fetchLatestDataSuccess: (state, action: PayloadAction<Record<string, LatestStationWeather>>) => {
            state.latestData.loading = false;
            state.latestData.error = null;
            state.latestData.data = action.payload;
        },
        fetchLatestDataFailure: (state, action: PayloadAction<string>) => {
            state.latestData.loading = false;
            state.latestData.error = action.payload;
        },
        fetchHistoricalDataStart: (state) => {
            state.historicalData.loading = true;
            state.historicalData.error = null;
        },
        fetchHistoricalDataSuccess: (
            state,
            action: PayloadAction<{ stationId: string; data: IStationDataByDate; dateRange: IDateRange }>,
        ) => {
            state.historicalData.loading = false;
            state.historicalData.error = null;
            state.historicalData.stationId = action.payload.stationId;
            state.historicalData.data = action.payload.data;
            state.availableDates[action.payload.stationId] = action.payload.dateRange;
        },
        fetchHistoricalDataFailure: (state, action: PayloadAction<string>) => {
            state.historicalData.loading = false;
            state.historicalData.error = action.payload;
        },
        setSelectedData: (state, action: PayloadAction<SelectedClimateData | null>) => {
            state.selectedData = action.payload;
        },
        selectLiveData: (state, action: PayloadAction<string>) => {
            const stationId = action.payload;
            const entry = state.latestData.data[stationId];
            if (!entry) {
                return;
            }
            state.selectedData = {
                data: entry.measurement,
                type: 'live',
                stationId,
            } satisfies SelectedClimateData;
        },
        selectHistoricalData: (state, action: PayloadAction<{ stationId: string; date: string }>) => {
            const { stationId, date } = action.payload;
            if (state.historicalData.stationId !== stationId || !state.historicalData.data) {
                return;
            }
            const measurement = state.historicalData.data[date];
            if (!measurement) {
                return;
            }
            state.selectedData = {
                data: measurement,
                type: 'historical',
                stationId,
            } satisfies SelectedClimateData;
        },
    },
});

export const fetchLatestStations = (): AppThunk<Promise<Record<string, LatestStationWeather>>> => async (dispatch) => {
    dispatch(fetchLatestDataStart());
    try {
        const response = await fetchLiveDataService();
        const latestEntries = Object.fromEntries(
            Object.entries(response.stationData).map(([stationId, measurement]) => {
                const station = response.stations[stationId];
                if (!station) {
                    throw new Error(`Missing station definition for ${stationId}`);
                }

                return [
                    stationId,
                    {
                        station: station.toJSON(),
                        measurement: measurement.toJSON(),
                    } satisfies LatestStationWeather,
                ];
            }),
        );
        dispatch(fetchLatestDataSuccess(latestEntries));
        return latestEntries;
    } catch (error) {
        const message = error instanceof Error
            ? error.message
            : 'Failed to fetch latest weather station data';
        dispatch(fetchLatestDataFailure(message));
        throw error instanceof Error ? error : new Error(message);
    }
};

export const fetchHistoricalStation = (stationId: string): AppThunk<Promise<IStationDataByDate>> => async (dispatch) => {
    dispatch(fetchHistoricalDataStart());
    try {
        const { data, dateRange } = await fetchDailyWeatherStationData(stationId);
        dispatch(fetchHistoricalDataSuccess({ stationId, data, dateRange }));
        return data;
    } catch (error) {
        const message = error instanceof Error
            ? error.message
            : 'Failed to fetch historical weather station data';
        dispatch(fetchHistoricalDataFailure(message));
        throw error instanceof Error ? error : new Error(message);
    }
};

export const updateDataByDate = (stationId: string | null, isoDateString: string): AppThunk => (dispatch) => {
    if (!stationId) {
        return;
    }

    const selectedDate = new Date(isoDateString);
    if (Number.isNaN(selectedDate.getTime())) {
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const normalizedSelected = new Date(selectedDate);
    normalizedSelected.setHours(0, 0, 0, 0);

    if (normalizedSelected.getTime() === today.getTime()) {
        dispatch(selectLiveData(stationId));
        return;
    }

    const year = normalizedSelected.getFullYear();
    const month = String(normalizedSelected.getMonth() + 1).padStart(2, '0');
    const day = String(normalizedSelected.getDate()).padStart(2, '0');
    const formattedDate = `${year}${month}${day}`;

    dispatch(selectHistoricalData({ stationId, date: formattedDate }));
};

const selectSlice = (state: RootState): WeatherStationDataState => {
    const maybeSlice = (state as RootState & { weatherStationData?: WeatherStationDataState }).weatherStationData;
    return maybeSlice ?? initialState;
};

export const selectLatestStationsData = (state: RootState): WeatherStationDataState['latestData'] =>
    selectSlice(state).latestData;

export const selectHistoricalStationData = (state: RootState): WeatherStationDataState['historicalData'] =>
    selectSlice(state).historicalData;

export const selectHistoricalMean = (state: RootState, stationId: string): number | null =>
    selectSlice(state).historicalMeans[stationId]?.hist_mean_1961_1990 ?? null;

export const selectAvailableDateRange = (
    state: RootState,
    stationId: string | null | undefined,
): IDateRange | null => {
    if (!stationId) {
        return null;
    }
    return selectSlice(state).availableDates[stationId] ?? null;
};

export const selectCurrentClimateData = (state: RootState): SelectedClimateData | null =>
    selectSlice(state).selectedData;

export const {
    fetchLatestDataStart,
    fetchLatestDataSuccess,
    fetchLatestDataFailure,
    fetchHistoricalDataStart,
    fetchHistoricalDataSuccess,
    fetchHistoricalDataFailure,
    setSelectedData,
    selectLiveData,
    selectHistoricalData,
} = weatherStationDataSlice.actions;

export default weatherStationDataSlice.reducer;