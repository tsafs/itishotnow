import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchDailyRecentByDateData } from '../../services/DailyRecentByDateService';
import { useSelector } from 'react-redux';
import { useMemo } from 'react';

export const fetchDailyRecentByDate = createAsyncThunk(
    'dailyRecentByDate/fetchData',
    async ({ year, month, day }, { rejectWithValue, getState }) => {
        const state = getState();
        const existingData = state.dailyRecentByDate.data?.[`${year}-${month}-${day}`];
        if (existingData) {
            // Return the existing data in the same format as fulfilled payload
            return { ...existingData };
        }
        try {
            const data = await fetchDailyRecentByDateData({ year, month, day });
            return { data, year, month, day };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const dailyRecentByDateSlice = createSlice({
    name: 'dailyRecentByDate',
    initialState: {
        data: null,
        status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
        error: null,
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchDailyRecentByDate.pending, (state) => {
                state.status = 'loading';
                state.data = null;
            })
            .addCase(fetchDailyRecentByDate.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.error = null;
                const { data, year, month, day } = action.payload;

                if (!state.data) {
                    state.data = {};
                }

                state.data[`${year}-${month}-${day}`] = data;
            })
            .addCase(fetchDailyRecentByDate.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || 'Failed to fetch dailyRecentByDate data for station';
            });
    },
});

export const selectDailyRecentByDateStatus = (state) => state.dailyRecentByDate.status;
export const selectDailyRecentByDateError = (state) => state.dailyRecentByDate.error;

// Selector hooks
export const useDailyRecentByDate = ({ year, month, day }) => {
    const data = useSelector(state => state.dailyRecentByDate.data);
    return useMemo(() => {
        return data?.[`${year}-${month}-${day}`] || null;
    }, [data, year, month, day]);
};

export default dailyRecentByDateSlice.reducer;
