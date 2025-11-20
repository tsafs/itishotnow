export type ReferenceHourKey = `hour_${number}`;
export type ReferenceHourlyValue = number | undefined;

export interface ReferenceYearlyHourlyInterpolatedByDayJSON extends Partial<Record<ReferenceHourKey, ReferenceHourlyValue>> {
    stationId: string;
}

/**
 * Represents hourly interpolated reference temperature series for a single station.
 */
export default class ReferenceYearlyHourlyInterpolatedByDay {
    private readonly stationId: string;
    private readonly hourlyValues: Partial<Record<ReferenceHourKey, ReferenceHourlyValue>>;

    constructor(
        stationId: string,
        hourlyValues: Partial<Record<ReferenceHourKey, ReferenceHourlyValue>> = {},
    ) {
        this.stationId = stationId;
        this.hourlyValues = { ...hourlyValues };
    }

    getStationId(): string {
        return this.stationId;
    }

    setHourValue(hour: ReferenceHourKey, value: ReferenceHourlyValue): void {
        this.hourlyValues[hour] = value;
    }

    getHourValue(hour: ReferenceHourKey): ReferenceHourlyValue {
        return this.hourlyValues[hour];
    }

    toJSON(): ReferenceYearlyHourlyInterpolatedByDayJSON {
        return {
            stationId: this.stationId,
            ...this.hourlyValues,
        } satisfies ReferenceYearlyHourlyInterpolatedByDayJSON;
    }

    static fromJSON(json: ReferenceYearlyHourlyInterpolatedByDayJSON): ReferenceYearlyHourlyInterpolatedByDay {
        const { stationId, ...hours } = json;
        return new ReferenceYearlyHourlyInterpolatedByDay(stationId, hours as Partial<Record<ReferenceHourKey, ReferenceHourlyValue>>);
    }
}

export type ReferenceYearlyHourlyInterpolatedByDayByStationId = Record<string, ReferenceYearlyHourlyInterpolatedByDayJSON>;
