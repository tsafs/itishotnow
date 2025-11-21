import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { fetchGermanCities } from '../../services/CityService.js';
import City, { type CityJSON } from '../../classes/City.js';
import type { RootState } from '../index.js';

export interface CityDataState {
    data: Record<string, CityJSON>;
    areCitiesCorrelated: boolean;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

export const fetchCityData = createAsyncThunk<
    Record<string, CityJSON>,
    void,
    { rejectValue: string }
>(
    'cityData/fetchData',
    async (_, { rejectWithValue }) => {
        try {
            const data = await fetchGermanCities();
            const result: Record<string, CityJSON> = {};
            for (const city of data) {
                result[city.id] = city.toJSON();
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
        setCities: (state, action: PayloadAction<Record<string, CityJSON>>) => {
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
            .addCase(fetchCityData.fulfilled, (state, action: PayloadAction<Record<string, CityJSON>>) => {
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
    (data): Record<string, City> => {
        const result: Record<string, City> = {};
        for (const [id, json] of Object.entries(data)) {
            result[id] = City.fromJSON(json);
        }
        return result;
    }
);
export const selectCorrelatedCities = createSelector(
    (state: RootState) => state.cityData,
    (cityData): Record<string, City> | null => {
        if (!cityData.areCitiesCorrelated) return null;
        const result: Record<string, City> = {};
        for (const [id, json] of Object.entries(cityData.data)) {
            result[id] = City.fromJSON(json);
        }
        return result;
    }
);
export const selectCityDataStatus = (state: RootState) => state.cityData.status;
export const selectCityDataError = (state: RootState) => state.cityData.error;
export const selectAreCitiesCorrelated = (state: RootState) => state.cityData.areCitiesCorrelated;

export default cityDataSlice.reducer;