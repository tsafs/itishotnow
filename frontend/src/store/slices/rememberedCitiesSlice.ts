import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

type RememberedCitiesState = string[];

const rememberedCitiesSlice = createSlice({
    name: 'rememberedCities',
    initialState: [] as RememberedCitiesState,
    reducers: {
        addRememberedCity: (state, action: PayloadAction<string>) => {
            const cityIdToAdd = action.payload;

            // Check if city is already remembered
            const alreadyExists = state.some(cityId => cityId === cityIdToAdd);

            if (!alreadyExists) {
                state.push(cityIdToAdd);
            }
        },
        clearRememberedCities: () => {
            return [] as RememberedCitiesState;
        },
    },
});

export const { addRememberedCity, clearRememberedCities } = rememberedCitiesSlice.actions;
export default rememberedCitiesSlice.reducer;