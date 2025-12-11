import { fetchDailyDataForStation } from '../../../../services/RollingAverageDataService.js';
import type { RootState } from '../../../../store/index.js';
import { type RollingAverageRecordMap } from '../../../../classes/RollingAverageRecord.js';
import { createDataSlice } from '../../../../store/factories/createDataSlice.js';

export interface IYearData extends Array<number | null> {
    length: 12;
}

export interface DailyHistoricalStationDataArgs {
    stationId: string;
}

export interface IData {
    stationId: string;
    monthlyMeans: Record<number, IYearData>;
    domain: [number, number];
}

const fetchFn = async ({ stationId }: DailyHistoricalStationDataArgs): Promise<IData> => {
    // Fetch map of class instances for computation
    const data = await fetchDailyDataForStation(stationId);

    // Compute aggregates using class instances
    const { monthlyMeans, domain } = calculateMonthlyMeansAndDomain(data);

    return {
        stationId,
        monthlyMeans,
        domain,
    };
}

/**
 * Create rollingAverageData slice using factory
 */
const { slice, actions, selectors } = createDataSlice<
    IData,
    DailyHistoricalStationDataArgs,
    'keyed'
>({
    name: 'dailyHistoricalStationData',
    fetchFn: fetchFn,
    stateShape: 'keyed',
    cache: {
        strategy: 'by-key',
        keyExtractor: ({ stationId }) => stationId,
        ttl: 1000 * 60 * 60 * 12,
    },
});

// Empty constant for rolling average data to avoid creating new [] object every time the state is empty
const EMPTY_DATA: IData = {
    stationId: '',
    monthlyMeans: {},
    domain: [0, 0],
};

// Export actions
export const fetchData = actions.fetch;
export const resetData = actions.reset;

// Export selectors
export const selectData = (state: RootState): Record<string, IData> => {
    const result = selectors.selectData(state);
    if (!result) {
        return {};
    }

    const record = result as unknown as Record<string, IData> | undefined;
    return record ?? {};
};

export const selectDataByStationId = (
    state: RootState,
    stationId: string | null | undefined,
): IData => {
    if (!stationId) {
        return EMPTY_DATA;
    }

    const dataMap = selectData(state);
    return dataMap[stationId] ?? EMPTY_DATA;
};
export const selectDataStatus = selectors.selectStatus;
export const selectDataError = selectors.selectError;

export default slice.reducer;

function calculateMonthlyMeansAndDomain(records: RollingAverageRecordMap): {
    monthlyMeans: Record<number, IYearData>;
    domain: [number, number];
} {
    const monthAccumulators: Record<number, { sum: number[]; count: number[] }> = {};

    for (const record of Object.values(records)) {
        const date = new Date(record.date);
        const year = date.getFullYear();
        const month = date.getMonth();

        if (!Number.isFinite(year) || !Number.isFinite(month)) {
            continue;
        }

        if (!monthAccumulators[year]) {
            monthAccumulators[year] = {
                sum: new Array(12).fill(0),
                count: new Array(12).fill(0),
            };
        }

        const accumulatorForYear = monthAccumulators[year];
        const tasmax = record.getMetric('tas');
        if (tasmax !== undefined) {
            accumulatorForYear.sum[month]! += tasmax;
            accumulatorForYear.count[month]! += 1;
        }
    }

    const monthlyMeans: Record<number, IYearData> = {};
    let minTemp = Infinity;
    let maxTemp = -Infinity;

    for (const [year, accumulator] of Object.entries(monthAccumulators)) {
        const yearNum = Number.parseInt(year, 10);
        const means: number[] = new Array(12);

        for (let month = 0; month < 12; month += 1) {
            const count = accumulator.count[month]!;
            const mean = count > 0 ? accumulator.sum[month]! / count : 0;
            means[month] = mean;
            minTemp = Math.min(minTemp, mean);
            maxTemp = Math.max(maxTemp, mean);
        }

        monthlyMeans[yearNum] = means as IYearData;
    }

    if (!Number.isFinite(minTemp) || !Number.isFinite(maxTemp)) {
        return {
            monthlyMeans,
            domain: [0, 0],
        };
    }

    return {
        monthlyMeans,
        domain: [minTemp, maxTemp],
    };
}
