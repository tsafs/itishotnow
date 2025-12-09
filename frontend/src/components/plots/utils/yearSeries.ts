export type SeriesValues = (number | null)[] & { length: 12 };

export interface ISeries {
    year: number;
    values: SeriesValues;
    stroke: string;
    strokeWidth: number;
    strokeOpacity: number;
}

export function computeMeanOfSeries(seriesList: SeriesValues[]): SeriesValues {
    const mean: SeriesValues = new Array(12).fill(null) as SeriesValues;

    for (let m = 0; m < 12; m += 1) {
        const vals: number[] = [];
        for (const series of seriesList) {
            const v = series[m];
            if (typeof v === 'number' && Number.isFinite(v)) vals.push(v);
        }
        mean[m] = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    }

    return mean;
}