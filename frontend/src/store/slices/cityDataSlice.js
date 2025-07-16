import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchGermanCities } from '../../services/CityService';

export const fetchCityData = createAsyncThunk(
    'cityData/fetchData',
    async (_, { rejectWithValue }) => {
        try {
            const data = await fetchGermanCities();
            return data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const cityDataSlice = createSlice({
    name: 'cityData',
    initialState: {
        rawData: [],
        mappedData: null,
        status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
        error: null,
    },
    reducers: {
        setCityMappedData: (state, action) => {
            state.mappedData = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCityData.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchCityData.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.rawData = action.payload;
                state.error = null;
            })
            .addCase(fetchCityData.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || 'Failed to fetch city data';
            });
    },
});

export const { setCityMappedData } = cityDataSlice.actions;

// Selectors
export const selectCityRawData = (state) => state.cityData.rawData;
export const selectCityMappedData = (state) => state.cityData.mappedData;
export const selectCityDataStatus = (state) => state.cityData.status;
export const selectCityDataError = (state) => state.cityData.error;

export default cityDataSlice.reducer;