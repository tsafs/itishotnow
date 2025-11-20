export type RollingAverageMetricKey = 'tas' | 'tasmin' | 'tasmax' | 'hurs' | string;

export interface RollingAverageRecordJSON {
    date: string;
    tas?: number | undefined;
    tasmin?: number | undefined;
    tasmax?: number | undefined;
    hurs?: number | undefined;
    [metric: string]: number | string | undefined;
}

/**
 * Represents rolling average climate metrics for a station on a given date.
 */
export default class RollingAverageRecord {
    private readonly date: string;
    private readonly metrics: Partial<Record<RollingAverageMetricKey, number | undefined>>;

    constructor(date: string, metrics: Partial<Record<RollingAverageMetricKey, number | undefined>> = {}) {
        this.date = date;
        this.metrics = { ...metrics };
    }

    getDate(): string {
        return this.date;
    }

    setMetric(metric: RollingAverageMetricKey, value: number | undefined): void {
        this.metrics[metric] = value;
    }

    getMetric(metric: RollingAverageMetricKey): number | undefined {
        return this.metrics[metric];
    }

    toJSON(): RollingAverageRecordJSON {
        return {
            date: this.date,
            ...this.metrics,
        } satisfies RollingAverageRecordJSON;
    }

    static fromJSON(json: RollingAverageRecordJSON): RollingAverageRecord {
        const { date, ...metrics } = json;
        return new RollingAverageRecord(date, metrics as Partial<Record<RollingAverageMetricKey, number | undefined>>);
    }
}

export type RollingAverageRecordList = RollingAverageRecordJSON[];
