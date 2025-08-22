import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { fetchGermanCities } from '../../services/CityService.js';
import City from '../../classes/City.js';

export interface CityDataState {
    data: Record<string, any>;
    areCitiesCorrelated: boolean;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

export const fetchCityData = createAsyncThunk<
    Record<string, any>,
    void,
    { rejectValue: string }
>(
    'cityData/fetchData',
    async (_, { rejectWithValue }) => {
        try {
            const data = await fetchGermanCities();
            let result: Record<string, any> = {}
            for (const city of data) {
                result[city.id] = city.toJSON();
            }
            return result;
        } catch (error: any) {
            return rejectWithValue(error.message);
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
        setCities: (state, action: PayloadAction<Record<string, any>>) => {
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
            .addCase(fetchCityData.fulfilled, (state, action: PayloadAction<Record<string, any>>) => {
                state.status = 'succeeded';
                state.data = action.payload;
                state.error = null;
            })
            .addCase(fetchCityData.rejected, (state, action) => {
                state.status = 'failed';
                state.error = (action.payload as string) || 'Failed to fetch city data';
            });
    },
});

export const { setCities } = cityDataSlice.actions;

// Selectors
export const selectCities = createSelector(
    (state: { cityData: CityDataState }) => state.cityData.data,
    (data) => {
        const result: Record<string, City> = {};
        for (const [cityId, cityData] of Object.entries(data || {})) {
            result[cityId] = City.fromJSON(cityData);
        }
        return result;
    }
);
export const selectCorrelatedCities = createSelector(
    (state: { cityData: CityDataState }) => state.cityData,
    (cityData) => {
        if (!cityData.areCitiesCorrelated) return null;
        const result: Record<string, City> = {};
        for (const [id, city] of Object.entries(cityData.data)) {
            result[id] = City.fromJSON(city);
        }
        return result;
    }
);
export const selectCityDataStatus = (state: { cityData: CityDataState }) => state.cityData.status;
export const selectCityDataError = (state: { cityData: CityDataState }) => state.cityData.error;
export const selectAreCitiesCorrelated = (state: { cityData: CityDataState }) => state.cityData.areCitiesCorrelated;

export default cityDataSlice.reducer;