import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { fetchDailyRecentByDateData } from '../../services/DailyRecentByDateService';
import { useMemo } from 'react';
import { useAppSelector } from '../hooks/useAppSelector';
import type { RootState } from '../index';
import type { IStationDataByStationId } from '../../classes/DailyRecentByStation';

// Type for 'YYYY-MM-DD' string
export type DateKey = `${number}-${number}-${number}`;

export interface DailyRecentByDateState {
    data: Record<string, IStationDataByStationId>; // Keyed by 'YYYY-MM-DD'
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: DailyRecentByDateState = {
    data: {},
    status: 'idle',
    error: null,
};

// Arguments for thunk
export interface DailyRecentByDateArgs {
    year: number;
    month: number;
    day: number;
}

// Payload for fulfilled thunk
export interface DailyRecentByDatePayload {
    data: IStationDataByStationId;
    year: number;
    month: number;
    day: number;
}

export const fetchDailyRecentByDate = createAsyncThunk<
    DailyRecentByDatePayload, // Return type
    DailyRecentByDateArgs,    // Argument type
    { state: RootState; rejectValue: string }
>(
    'dailyRecentByDate/fetchData',
    async ({ year, month, day }, { rejectWithValue, getState }) => {
        const state = getState();
        const existingData = state.dailyRecentByDate.data[`${year}-${month}-${day}`];
        if (existingData) {
            // Return the existing data in the same format as fulfilled payload
            return { data: existingData, year, month, day };
        }
        try {
            const data = await fetchDailyRecentByDateData({ year, month, day });
            return { data, year, month, day };
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

const dailyRecentByDateSlice = createSlice({
    name: 'dailyRecentByDate',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchDailyRecentByDate.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchDailyRecentByDate.fulfilled, (state, action: PayloadAction<DailyRecentByDatePayload>) => {
                state.status = 'succeeded';
                state.error = null;
                const { data, year, month, day } = action.payload;
                state.data[`${year}-${month}-${day}`] = data;
            })
            .addCase(fetchDailyRecentByDate.rejected, (state, action) => {
                state.status = 'failed';
                state.error = (action.payload as string) || 'Failed to fetch dailyRecentByDate data for station';
            });
    },
});

export const selectDailyRecentByDateStatus = (state: RootState) => state.dailyRecentByDate.status;
export const selectDailyRecentByDateError = (state: RootState) => state.dailyRecentByDate.error;

// Selector hooks
export const useDailyRecentByDate = ({ year, month, day }: DailyRecentByDateArgs): any => {
    const data = useAppSelector((state: RootState) => state.dailyRecentByDate.data);
    return useMemo(() => {
        return data[`${year}-${month}-${day}`] || null;
    }, [data, year, month, day]);
};

export default dailyRecentByDateSlice.reducer;
