import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { addRememberedCity } from './rememberedCitiesSlice.js';
import type { AppThunk } from '../index.js';

export interface SelectedCityState {
    cityId: string | null;
}

const initialState: SelectedCityState = {
    cityId: null,
};

const selectedCitySlice = createSlice({
    name: 'selectedCity',
    initialState,
    reducers: {
        setSelectedCity: (state, action: PayloadAction<string | null>) => {
            state.cityId = action.payload;
        },
    },
});

// Create a thunk that sets the selected city and adds it to remembered cities if needed
export const selectCity = (cityId: string | null, isPredefinedCity = false): AppThunk => (dispatch) => {

    // Only store the cityId in the selected city slice
    dispatch(setSelectedCity(cityId));

    // If not a predefined city, add it to remembered cities
    if (!isPredefinedCity && cityId) {
        dispatch(addRememberedCity(cityId));
    }
};

export const { setSelectedCity } = selectedCitySlice.actions;
export default selectedCitySlice.reducer;