export type ReferenceHourKey = `hour_${number}`;
export type ReferenceHourlyValue = number | undefined;

export interface IReferenceYearlyHourlyInterpolatedByDay {
    readonly stationId: string;
    getHourValue(hour: ReferenceHourKey): ReferenceHourlyValue;
    equals(other: IReferenceYearlyHourlyInterpolatedByDay): boolean;
}

export interface ReferenceYearlyHourlyInterpolatedByDayJSON extends Partial<Record<ReferenceHourKey, ReferenceHourlyValue>> {
    stationId: string;
}

/**
 * Represents hourly interpolated reference temperature series for a single station.
 * Immutable class - use ReferenceYearlyHourlyInterpolatedByDayBuilder for construction.
 */
export default class ReferenceYearlyHourlyInterpolatedByDay implements IReferenceYearlyHourlyInterpolatedByDay {
    public readonly stationId: string;
    private readonly hourlyValues: Readonly<Partial<Record<ReferenceHourKey, number>>>;

    constructor(
        stationId: string,
        hourlyValues: Partial<Record<ReferenceHourKey, number>> = {},
    ) {
        this.stationId = stationId;
        this.hourlyValues = Object.freeze({ ...hourlyValues });
    }

    getStationId(): string {
        return this.stationId;
    }

    getHourValue(hour: ReferenceHourKey): ReferenceHourlyValue {
        return this.hourlyValues[hour];
    }

    getAllHourlyValues(): Readonly<Partial<Record<ReferenceHourKey, number>>> {
        return this.hourlyValues;
    }

    equals(other: IReferenceYearlyHourlyInterpolatedByDay): boolean {
        if (this.stationId !== other.stationId) {
            return false;
        }

        const thisKeys = Object.keys(this.hourlyValues).sort();
        const otherValues = (other as ReferenceYearlyHourlyInterpolatedByDay).hourlyValues;
        const otherKeys = Object.keys(otherValues).sort();

        if (thisKeys.length !== otherKeys.length) {
            return false;
        }

        if (thisKeys.some((k, i) => k !== otherKeys[i])) {
            return false;
        }

        return thisKeys.every(k => this.hourlyValues[k as ReferenceHourKey] === other.getHourValue(k as ReferenceHourKey));
    }

    toJSON(): ReferenceYearlyHourlyInterpolatedByDayJSON {
        return {
            stationId: this.stationId,
            ...this.hourlyValues,
        } satisfies ReferenceYearlyHourlyInterpolatedByDayJSON;
    }

    static fromJSON(json: ReferenceYearlyHourlyInterpolatedByDayJSON): ReferenceYearlyHourlyInterpolatedByDay {
        const { stationId, ...hours } = json;
        const validHours: Partial<Record<ReferenceHourKey, number>> = {};

        for (const [key, value] of Object.entries(hours)) {
            if (typeof value === 'number' && Number.isFinite(value)) {
                validHours[key as ReferenceHourKey] = value;
            } else if (value !== undefined) {
                console.warn(`Skipping invalid hour value ${key}: ${value}`);
            }
        }

        return new ReferenceYearlyHourlyInterpolatedByDay(stationId, validHours);
    }
}

/**
 * Builder for constructing ReferenceYearlyHourlyInterpolatedByDay instances.
 * Provides a fluent API for step-by-step construction with validation.
 * 
 * @example
 * const reference = new ReferenceYearlyHourlyInterpolatedByDayBuilder()
 *   .setStationId('12345')
 *   .setHourValue('hour_0', 10.5)
 *   .setHourValue('hour_6', 15.2)
 *   .setHourValue('hour_12', 20.8)
 *   .setHourValue('hour_18', 18.3)
 *   .build();
 */
export class ReferenceYearlyHourlyInterpolatedByDayBuilder {
    private stationId: string = '';
    private hourlyValues: Partial<Record<ReferenceHourKey, number>> = {};

    /**
     * Sets the station ID.
     * @param stationId - Station identifier
     * @returns this builder for chaining
     */
    setStationId(stationId: string): this {
        if (!stationId || stationId.trim() === '') {
            console.warn('Invalid stationId in ReferenceYearlyHourlyInterpolatedByDayBuilder: empty string');
        } else {
            this.stationId = stationId;
        }
        return this;
    }

    /**
     * Sets a specific hour value.
     * @param hour - Hour key (e.g., 'hour_0', 'hour_6')
     * @param value - Numeric value (undefined values are skipped)
     * @returns this builder for chaining
     */
    setHourValue(hour: ReferenceHourKey | number, value: number | undefined): this {
        const hourKey: ReferenceHourKey = typeof hour === 'number' ? `hour_${hour}` : hour;

        // Validate hour number if numeric
        if (typeof hour === 'number' && (hour < 0 || hour > 23)) {
            console.warn(`Invalid hour number: ${hour} (must be 0-23)`);
            return this;
        }

        if (value !== undefined && Number.isFinite(value)) {
            this.hourlyValues[hourKey] = value;
        } else if (value !== undefined) {
            console.warn(`Invalid hour value for ${hourKey}: ${value}`);
        }
        return this;
    }

    /**
     * Sets multiple hour values at once.
     * @param hours - Record of hour key-value pairs
     * @returns this builder for chaining
     */
    setHourValues(hours: Partial<Record<ReferenceHourKey, number | undefined>>): this {
        for (const [key, value] of Object.entries(hours)) {
            this.setHourValue(key as ReferenceHourKey, value);
        }
        return this;
    }

    /**
     * Builds the ReferenceYearlyHourlyInterpolatedByDay.
     * @returns Instance or undefined if stationId is invalid
     */
    build(): ReferenceYearlyHourlyInterpolatedByDay | undefined {
        if (!this.stationId) {
            console.warn('Cannot build ReferenceYearlyHourlyInterpolatedByDay without stationId');
            return undefined;
        }

        return new ReferenceYearlyHourlyInterpolatedByDay(this.stationId, this.hourlyValues);
    }

    /**
     * Resets the builder to initial state.
     * @returns this builder for chaining
     */
    reset(): this {
        this.stationId = '';
        this.hourlyValues = {};
        return this;
    }
}

export type ReferenceYearlyHourlyInterpolatedByDayByStationId = Record<string, ReferenceYearlyHourlyInterpolatedByDayJSON>;
