import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { fetchGermanCities } from '../../services/CityService.js';
import type { ICity } from '../../classes/City.js';
import type { RootState } from '../index.js';

export interface CityDataState {
    data: Record<string, ICity>;
    areCitiesCorrelated: boolean;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

export const fetchCityData = createAsyncThunk<
    Record<string, ICity>,
    void,
    { rejectValue: string }
>(
    'cityData/fetchData',
    async (_, { rejectWithValue }) => {
        try {
            const data = await fetchGermanCities();
            const result: Record<string, ICity> = {};
            for (const city of data) {
                result[city.id] = city;
            }
            return result;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch city data';
            return rejectWithValue(message);
        }
    }
);

const initialState: CityDataState = {
    data: {},
    areCitiesCorrelated: false,
    status: 'idle',
    error: null,
};

const cityDataSlice = createSlice({
    name: 'cityData',
    initialState,
    reducers: {
        setCities: (state, action: PayloadAction<Record<string, ICity>>) => {
            state.data = action.payload;
            state.areCitiesCorrelated = true;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCityData.pending, (state) => {
                state.status = 'loading';
                state.areCitiesCorrelated = false;
            })
            .addCase(fetchCityData.fulfilled, (state, action: PayloadAction<Record<string, ICity>>) => {
                state.status = 'succeeded';
                state.data = action.payload;
                state.error = null;
            })
            .addCase(fetchCityData.rejected, (state, action) => {
                state.status = 'failed';
                state.error = typeof action.payload === 'string'
                    ? action.payload
                    : action.error?.message ?? 'Failed to fetch city data';
            });
    },
});

export const { setCities } = cityDataSlice.actions;

// Selectors
export const selectCities = createSelector(
    (state: RootState) => state.cityData.data,
    (data): Record<string, ICity> => data
);
export const selectCorrelatedCities = createSelector(
    (state: RootState) => state.cityData,
    (cityData): Record<string, ICity> | null => {
        if (!cityData.areCitiesCorrelated) return null;
        return cityData.data;
    }
);
export const selectCityDataStatus = (state: RootState) => state.cityData.status;
export const selectCityDataError = (state: RootState) => state.cityData.error;
export const selectAreCitiesCorrelated = (state: RootState) => state.cityData.areCitiesCorrelated;

export default cityDataSlice.reducer;