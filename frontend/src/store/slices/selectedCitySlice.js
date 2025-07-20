import { createSlice } from '@reduxjs/toolkit';
import { addRememberedCity } from './rememberedCitiesSlice';
import { getNow } from '../../utils/dateUtils';
import { selectCorrelatedCities } from './cityDataSlice';
import { fetchDailyDataForStation } from './historicalDataForStationSlice';

const selectedCitySlice = createSlice({
    name: 'selectedCity',
    initialState: {
        cityId: null
    },
    reducers: {
        setSelectedCity: (state, action) => {
            state.cityId = action.payload;
        },
    },
});

// Create a thunk that sets the selected city and adds it to remembered cities if needed
export const selectCity = (cityId, isPredefinedCity = false) => (dispatch, getState) => {
    // Only store the cityId in the selected city slice
    dispatch(setSelectedCity(cityId));

    // If not a predefined city, add it to remembered cities
    if (!isPredefinedCity) {
        dispatch(addRememberedCity(cityId));
    }

    // Preload historical data
    setTimeout(() => {
        const state = getState();
        const city = selectCorrelatedCities(state)?.[cityId];

        if (!city) return;

        const today = getNow();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const formattedDate = `${year}${month}${day}`;

        dispatch(fetchDailyDataForStation(city.station_id, formattedDate));
    }, 1000);
};

export const { setSelectedCity } = selectedCitySlice.actions;
export default selectedCitySlice.reducer;