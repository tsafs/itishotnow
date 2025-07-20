import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { fetchGermanCities } from '../../services/CityService';
import City from '../../classes/City';

export const fetchCityData = createAsyncThunk(
    'cityData/fetchData',
    async (_, { rejectWithValue }) => {
        try {
            const data = await fetchGermanCities();
            let result = {}
            for (const city of data) {
                result[city.id] = city.toJSON();
            }
            return result;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const cityDataSlice = createSlice({
    name: 'cityData',
    initialState: {
        data: [],
        areCitiesCorrelated: false,
        status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
        error: null,
    },
    reducers: {
        setCities: (state, action) => {
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
            .addCase(fetchCityData.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.data = action.payload;
                state.error = null;
            })
            .addCase(fetchCityData.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || 'Failed to fetch city data';
            });
    },
});

export const { setCities } = cityDataSlice.actions;

// Selectors
export const selectCities = createSelector(
    state => state.cityData.data,
    (data) => {
        const result = {};
        for (const [cityId, cityData] of Object.entries(data || {})) {
            result[cityId] = City.fromJSON(cityData);
        }
        return result;
    }
);
export const selectCorrelatedCities = createSelector(
    state => state.cityData,
    (cityData) => {
        if (!cityData.areCitiesCorrelated) return null;
        const result = {};
        for (const [id, city] of Object.entries(cityData.data)) {
            result[id] = City.fromJSON(city);
        }
        return result;
    }
);
export const selectCityDataStatus = (state) => state.cityData.status;
export const selectCityDataError = (state) => state.cityData.error;
export const selectAreCitiesCorrelated = (state) => state.cityData.areCitiesCorrelated;

export default cityDataSlice.reducer;