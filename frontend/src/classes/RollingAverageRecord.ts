import { isValidISODate } from '../utils/csvUtils';

export type RollingAverageMetricKey = 'tas' | 'tasmin' | 'tasmax' | 'hurs' | string;

export interface IRollingAverageRecord {
    readonly date: string;
    getMetric(key: RollingAverageMetricKey): number | undefined;
    equals(other: IRollingAverageRecord): boolean;
}

export interface RollingAverageRecordJSON {
    date: string;
    tas?: number;
    tasmin?: number;
    tasmax?: number;
    hurs?: number;
    [metric: string]: number | string | undefined;
}

/**
 * Represents rolling average climate metrics for a station on a given date.
 * Immutable class - use RollingAverageRecordBuilder for construction.
 */
export default class RollingAverageRecord implements IRollingAverageRecord {
    public readonly date: string;
    private readonly metrics: Readonly<Record<string, number>>;

    constructor(date: string, metrics: Record<string, number> = {}) {
        this.date = date;
        this.metrics = Object.freeze({ ...metrics });
    }

    getDate(): string {
        return this.date;
    }

    getMetric(metric: RollingAverageMetricKey): number | undefined {
        return this.metrics[metric];
    }

    getAllMetrics(): Readonly<Record<string, number>> {
        return this.metrics;
    }

    equals(other: IRollingAverageRecord): boolean {
        if (this.date !== other.date) {
            return false;
        }

        const thisKeys = Object.keys(this.metrics).sort();
        const otherMetrics = (other as RollingAverageRecord).metrics;
        const otherKeys = Object.keys(otherMetrics).sort();

        if (thisKeys.length !== otherKeys.length) {
            return false;
        }

        if (thisKeys.some((k, i) => k !== otherKeys[i])) {
            return false;
        }

        return thisKeys.every(k => this.metrics[k] === other.getMetric(k));
    }

    toJSON(): RollingAverageRecordJSON {
        return {
            date: this.date,
            ...this.metrics,
        } satisfies RollingAverageRecordJSON;
    }

    static fromJSON(json: RollingAverageRecordJSON): RollingAverageRecord {
        const { date, ...metrics } = json;
        const validMetrics: Record<string, number> = {};

        for (const [key, value] of Object.entries(metrics)) {
            if (typeof value === 'number' && Number.isFinite(value)) {
                validMetrics[key] = value;
            } else if (value !== undefined) {
                console.warn(`Skipping invalid metric ${key}: ${value}`);
            }
        }

        return new RollingAverageRecord(date, validMetrics);
    }
}

/**
 * Builder for constructing RollingAverageRecord instances.
 * Provides a fluent API for step-by-step construction with validation.
 * 
 * @example
 * const record = new RollingAverageRecordBuilder()
 *   .setDate('2025-11-21')
 *   .setMetric('tas', 15.5)
 *   .setMetric('tasmin', 10.2)
 *   .setMetric('tasmax', 20.8)
 *   .build();
 */
export class RollingAverageRecordBuilder {
    private date: string = '';
    private metrics: Record<string, number> = {};

    /**
     * Sets the date for the record.
     * @param date - ISO date string (YYYY-MM-DD)
     * @returns this builder for chaining
     */
    setDate(date: string): this {
        if (!isValidISODate(date)) {
            console.warn(`Invalid date in RollingAverageRecordBuilder: ${date}`);
        } else {
            this.date = date;
        }
        return this;
    }

    /**
     * Sets a metric value.
     * @param key - Metric key (e.g., 'tas', 'tasmin', 'tasmax', 'hurs')
     * @param value - Numeric value (undefined values are skipped)
     * @returns this builder for chaining
     */
    setMetric(key: RollingAverageMetricKey, value: number | undefined): this {
        if (value !== undefined && Number.isFinite(value)) {
            this.metrics[key] = value;
        } else if (value !== undefined) {
            console.warn(`Invalid metric value for ${key}: ${value}`);
        }
        return this;
    }

    /**
     * Sets multiple metrics at once.
     * @param metrics - Record of metric key-value pairs
     * @returns this builder for chaining
     */
    setMetrics(metrics: Record<string, number | undefined>): this {
        for (const [key, value] of Object.entries(metrics)) {
            this.setMetric(key, value);
        }
        return this;
    }

    /**
     * Builds the RollingAverageRecord.
     * @returns RollingAverageRecord instance or undefined if date is invalid
     */
    build(): RollingAverageRecord | undefined {
        if (!this.date) {
            console.warn('Cannot build RollingAverageRecord without date');
            return undefined;
        }

        return new RollingAverageRecord(this.date, this.metrics);
    }

    /**
     * Resets the builder to initial state.
     * @returns this builder for chaining
     */
    reset(): this {
        this.date = '';
        this.metrics = {};
        return this;
    }
}

export type RollingAverageRecordList = RollingAverageRecordJSON[];
