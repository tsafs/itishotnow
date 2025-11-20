export interface YearlyMeanByDayJSON {
    stationId: string;
    tasmin?: number | undefined;
    tasmax?: number | undefined;
    tas?: number | undefined;
}

/**
 * Represents the historical yearly mean temperature metrics for a station on a specific day.
 */
export default class YearlyMeanByDay {
    public readonly stationId: string;
    public readonly tasmin: number | undefined;
    public readonly tasmax: number | undefined;
    public readonly tas: number | undefined;

    constructor(
        stationId: string,
        tasmin?: number | undefined,
        tasmax?: number | undefined,
        tas?: number | undefined,
    ) {
        this.stationId = stationId;
        this.tasmin = tasmin;
        this.tasmax = tasmax;
        this.tas = tas;
    }

    toJSON(): YearlyMeanByDayJSON {
        return {
            stationId: this.stationId,
            tasmin: this.tasmin,
            tasmax: this.tasmax,
            tas: this.tas,
        } satisfies YearlyMeanByDayJSON;
    }

    static fromJSON(json: YearlyMeanByDayJSON): YearlyMeanByDay {
        return new YearlyMeanByDay(json.stationId, json.tasmin, json.tasmax, json.tas);
    }
}

export type YearlyMeanByDayByStationId = Record<string, YearlyMeanByDayJSON>;
