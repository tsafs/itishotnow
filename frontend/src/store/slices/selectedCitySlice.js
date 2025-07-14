import { createSlice } from '@reduxjs/toolkit';
import { getNow } from '../../utils/dateUtils';
import { addRememberedCity } from './rememberedCitiesSlice';
import { fetchHistoricalStation } from './weatherStationDataSlice';

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

// Unified action creator to handle city selection, remembering, and loading appropriate data
export const selectCity = (city, isPredefinedCity = false) => (dispatch, getState) => {
    dispatch(setSelectedCity(city));

    // If not a predefined city, add it to remembered cities
    if (!isPredefinedCity) {
        dispatch(addRememberedCity(city));
    }

    // If city has a station_id, preload historical data
    if (city && city.station_id) {
        setTimeout(() => {
            const today = getNow();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const formattedDate = `${year}${month}${day}`;

            dispatch(fetchHistoricalStation(city.station_id, formattedDate));
        }, 1000);
    }
};

export default selectedCitySlice.reducer;