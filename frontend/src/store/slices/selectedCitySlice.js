import { createSlice } from '@reduxjs/toolkit';
import { fetchHistoricalStation } from './weatherStationDataSlice';
import { getNow } from '../../utils/dateUtils';
import { addRememberedCity } from './rememberedCitiesSlice';

const selectedCitySlice = createSlice({
    name: 'selectedCity',
    initialState: null,
    reducers: {
        setSelectedCity: (state, action) => {
            return action.payload;
        },
    },
});

export const { setSelectedCity } = selectedCitySlice.actions;

// Helper function to get yesterday's date in YYYYMMDD format
const getYesterdayFormatted = () => {
    const yesterday = new Date(getNow());
    yesterday.setDate(yesterday.getDate() - 1);

    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');

    return `${year}${month}${day}`;
};

// Unified action creator to handle city selection, remembering, and loading historical data
export const selectCity = (city, isPredefinedCity = false) => (dispatch) => {
    dispatch(setSelectedCity(city));

    // If not a predefined city, add it to remembered cities
    if (!isPredefinedCity) {
        dispatch(addRememberedCity(city));
    }

    // If city has a station_id, load historical data
    if (city && city.station_id) {
        // Wait a brief moment to allow other UI updates to complete
        setTimeout(() => {
            const yesterdayFormatted = getYesterdayFormatted();

            // Fetch historical data for yesterday for the selected city
            dispatch(fetchHistoricalStation(city.station_id, yesterdayFormatted));
        }, 1000); // Wait 1 second before loading historical data
    }
};

export default selectedCitySlice.reducer;
