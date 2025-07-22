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
    },
    // Currently selected climate data (either live or historical)
    selectedData: {
        data: null,
        type: null, // 'live' or 'historical'
        station_id: null
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
            state.historicalData.station_id = action.payload.station_id;
            if (action.payload.dateRange && action.payload.station_id) {
                state.availableDates[action.payload.station_id] = action.payload.dateRange;
            }
        },
        fetchHistoricalDataFailure: (state, action) => {
            state.historicalData.loading = false;
            state.historicalData.error = action.payload;
        },
        setSelectedData: (state, action) => {
            state.selectedData = action.payload;
        },
        // Set selected data to live data for a specific station
        selectLiveData: (state, action) => {
            const station_id = action.payload;
            const liveData = state.latestData.data.find(station =>
                station.station_id === station_id);

            if (liveData) {
                state.selectedData = {
                    data: liveData,
                    type: 'live',
                    station_id
                };
            }
        },
        // Set selected data to historical data
        selectHistoricalData: (state, action) => {
            const { station_id, date } = action.payload;
            if (state.historicalData.data &&
                state.historicalData.station_id === station_id &&
                Object.keys(state.historicalData.data).includes(date)) {
                state.selectedData = {
                    data: state.historicalData.data[date],
                    type: 'historical',
                    station_id
                };
            }
        }
    }
});

export const {
    fetchLatestDataStart,
    fetchLatestDataSuccess,
    fetchLatestDataFailure,
    fetchHistoricalDataStart,
    fetchHistoricalDataSuccess,
    fetchHistoricalDataFailure,
    setSelectedData,
    selectLiveData,
    selectHistoricalData
} = weatherStationDataSlice.actions;

// Thunks
export const fetchLatestStations = () => async (dispatch) => {
    dispatch(fetchLatestDataStart());
    try {
        // Fetch weather stations data
        const stationsData = await fetchLatestWeatherStationsData();
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

export const fetchHistoricalStation = (station_id, date) => async (dispatch) => {
    dispatch(fetchHistoricalDataStart());
    try {
        const { data, dateRange } = await fetchDailyWeatherStationData(station_id, date);
        dispatch(fetchHistoricalDataSuccess({ station_id, data, dateRange }));
        return data;
    } catch (error) {
        dispatch(fetchHistoricalDataFailure(error.message));
        throw error;
    }
};

// New function to handle data selection based on selected date
export const updateDataByDate = (station_id, dateString) => (dispatch) => {
    if (!station_id) return;

    // Convert ISO string to Date object
    const selectedDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate.toDateString() === today.toDateString()) {
        // If today is selected, show live data
        dispatch(selectLiveData(station_id));
    } else {
        // For any other date, show historical data
        // Format date as YYYYMMDD
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const formattedDate = `${year}${month}${day}`;

        dispatch(selectHistoricalData({ station_id, date: formattedDate }));
    }
};

// Selectors
export const selectLatestStationsData = (state) => state.weatherStationData.latestData;
export const selectHistoricalStationData = (state) => state.weatherStationData.historicalData;
export const selectHistoricalMean = (state, station_id) =>
    state.weatherStationData.historicalMeans[station_id]?.hist_mean_1961_1990;
export const selectAvailableDateRange = (state, station_id) => {
    if (!station_id) return null;
    return state.weatherStationData.availableDates[station_id];
}
export const selectCurrentClimateData = (state) => state.weatherStationData.selectedData;

export default weatherStationDataSlice.reducer;