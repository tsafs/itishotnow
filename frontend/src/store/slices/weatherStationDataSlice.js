import { createSlice } from '@reduxjs/toolkit';
import {
    fetchLatestWeatherStationsData,
    fetchDailyWeatherStationData,
    fetchGermanCities
} from '../../services/DataService';
import { findNearestStationsForCities } from '../../utils/locationUtils';
import { setCities } from './citiesSlice';

const initialState = {
    // Latest data from stations (current day)
    latestData: {
        loading: false,
        error: null,
        data: []
    },
    // Historical daily data for a specific station and date
    historicalData: {
        loading: false,
        error: null,
        data: null,
        station_id: null,
        date: null
    },
    // Store historical means separately since they're only available in latest data
    historicalMeans: {
        // Map of station_id to historical mean values
        // Example: { "123": { hist_mean_1961_1990: 12.5 }, ... }
    },
    // Available date ranges for historical data by station_id
    availableDates: {
        // Example: { "13675": { from: "20250101", to: "20250711" }, ... }
    }
};

const weatherStationDataSlice = createSlice({
    name: 'weatherStationData',
    initialState,
    reducers: {
        fetchLatestDataStart: (state) => {
            state.latestData.loading = true;
            state.latestData.error = null;
        },
        fetchLatestDataSuccess: (state, action) => {
            state.latestData.loading = false;
            state.latestData.data = action.payload;

            // Store historical means for each station
            action.payload.forEach(station => {
                if (station.station_id && station.hist_mean_1961_1990 !== undefined) {
                    if (!state.historicalMeans[station.station_id]) {
                        state.historicalMeans[station.station_id] = {};
                    }
                    state.historicalMeans[station.station_id].hist_mean_1961_1990 = station.hist_mean_1961_1990;
                }
            });
        },
        fetchLatestDataFailure: (state, action) => {
            state.latestData.loading = false;
            state.latestData.error = action.payload;
        },
        fetchHistoricalDataStart: (state) => {
            state.historicalData.loading = true;
            state.historicalData.error = null;
        },
        fetchHistoricalDataSuccess: (state, action) => {
            state.historicalData.loading = false;
            state.historicalData.data = action.payload.data;
            state.historicalData.station_id = action.payload.data.station_id;
            state.historicalData.date = action.payload.data.date;

            // Add historical means to the historical data if available
            if (state.historicalMeans[action.payload.data.station_id]) {
                state.historicalData.data.hist_mean_1961_1990 =
                    state.historicalMeans[action.payload.data.station_id].hist_mean_1961_1990;
            }

            // Store the date range information if provided
            if (action.payload.dateRange && action.payload.data.station_id) {
                state.availableDates[action.payload.data.station_id] = action.payload.dateRange;
            }
        },
        fetchHistoricalDataFailure: (state, action) => {
            state.historicalData.loading = false;
            state.historicalData.error = action.payload;
        }
    }
});

export const {
    fetchLatestDataStart,
    fetchLatestDataSuccess,
    fetchLatestDataFailure,
    fetchHistoricalDataStart,
    fetchHistoricalDataSuccess,
    fetchHistoricalDataFailure
} = weatherStationDataSlice.actions;

// Thunks
export const fetchLatestStations = () => async (dispatch) => {
    dispatch(fetchLatestDataStart());
    try {
        // Fetch weather stations data
        const stationsData = await fetchLatestWeatherStationsData();
        stationsData.forEach(station => {
            // Mark this data as "live data"
            station.dataType = 'live';
        });
        dispatch(fetchLatestDataSuccess(stationsData));

        // Fetch cities data and find nearest stations in one go
        const citiesData = await fetchGermanCities();
        const citiesWithNearestStations = findNearestStationsForCities(citiesData, stationsData);

        // Dispatch cities to Redux store
        dispatch(setCities(citiesWithNearestStations));

        return stationsData;
    } catch (error) {
        dispatch(fetchLatestDataFailure(error.message));
        throw error;
    }
};

export const fetchHistoricalStation = (station_id, date) => async (dispatch, getState) => {
    dispatch(fetchHistoricalDataStart());
    try {
        // fetchDailyWeatherStationData now returns both data and dateRange
        const { data, dateRange } = await fetchDailyWeatherStationData(station_id, date);

        // Mark this data as "historical data"
        data.dataType = 'historical';

        // Retrieve historical mean from state if available
        const state = getState();
        if (state.weatherStationData.historicalMeans[station_id]) {
            data.hist_mean_1961_1990 = state.weatherStationData.historicalMeans[station_id].hist_mean_1961_1990;
        }

        // Pass both data and dateRange to the reducer
        dispatch(fetchHistoricalDataSuccess({ data, dateRange }));

        return data;
    } catch (error) {
        dispatch(fetchHistoricalDataFailure(error.message));
        throw error;
    }
};

// Selectors
export const selectLatestStationsData = (state) => state.weatherStationData.latestData;
export const selectHistoricalStationData = (state) => state.weatherStationData.historicalData;
export const selectHistoricalMean = (state, station_id) =>
    state.weatherStationData.historicalMeans[station_id]?.hist_mean_1961_1990;
export const selectAvailableDateRange = (state, station_id) =>
    state.weatherStationData.availableDates[station_id];

export default weatherStationDataSlice.reducer;