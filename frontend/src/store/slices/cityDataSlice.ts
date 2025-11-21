import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { fetchGermanCities } from '../../services/CityService.js';
import City, { type CityJSON } from '../../classes/City.js';
import type { RootState } from '../index.js';

/**
 * City data state
 * Extended from base data state to include correlation flag
 */
export interface CityDataState {
    data: Record<string, CityJSON>;
    areCitiesCorrelated: boolean;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | undefined;
}

/**
 * Fetch city data async thunk
 */
export const fetchCityData = createAsyncThunk<
    Record<string, CityJSON>,
    void,
    { rejectValue: string }
>(
    'cityData/fetch',
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

/**
 * Initial state
 */
const initialState: CityDataState = {
    data: {},
    areCitiesCorrelated: false,
    status: 'idle',
    error: undefined,
};

/**
 * City data slice with custom correlation logic
 */
const cityDataSlice = createSlice({
    name: 'cityData',
    initialState,
    reducers: {
        setCities: (state, action: PayloadAction<Record<string, CityJSON>>) => {
            state.data = action.payload;
            state.areCitiesCorrelated = true;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCityData.pending, (state) => {
                state.status = 'loading';
                state.areCitiesCorrelated = false;
            })
            .addCase(fetchCityData.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.data = action.payload;
                state.error = undefined;
            })
            .addCase(fetchCityData.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload ?? 'Failed to fetch city data';
            });
    },
});

// Export actions
export const { setCities } = cityDataSlice.actions;

// Selectors
export const selectCityDataStatus = (state: RootState) => state.cityData.status;
export const selectCityDataError = (state: RootState) => state.cityData.error;
export const selectAreCitiesCorrelated = (state: RootState) => state.cityData.areCitiesCorrelated;

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

export default cityDataSlice.reducer;