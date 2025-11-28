export interface IYearlyMeanByDay {
    readonly stationId: string;
    readonly tasmin: number | undefined;
    readonly tasmax: number | undefined;
    readonly tas: number | undefined;
    equals(other: IYearlyMeanByDay): boolean;
}

export interface YearlyMeanByDayJSON {
    stationId: string;
    tasmin?: number;
    tasmax?: number;
    tas?: number;
}

/**
 * Represents the historical yearly mean temperature metrics for a station on a specific day.
 */
export default class YearlyMeanByDay implements IYearlyMeanByDay {
    public readonly stationId: string;
    public readonly tasmin: number | undefined;
    public readonly tasmax: number | undefined;
    public readonly tas: number | undefined;

    constructor(
        stationId: string,
        tasmin?: number,
        tasmax?: number,
        tas?: number,
    ) {
        this.stationId = stationId;
        this.tasmin = tasmin;
        this.tasmax = tasmax;
        this.tas = tas;
    }

    equals(other: IYearlyMeanByDay): boolean {
        return (
            this.stationId === other.stationId &&
            this.tasmin === other.tasmin &&
            this.tasmax === other.tasmax &&
            this.tas === other.tas
        );
    }

    toJSON(): YearlyMeanByDayJSON {
        const json: YearlyMeanByDayJSON = {
            stationId: this.stationId,
        };

        if (this.tasmin !== undefined) {
            json.tasmin = this.tasmin;
        }
        if (this.tasmax !== undefined) {
            json.tasmax = this.tasmax;
        }
        if (this.tas !== undefined) {
            json.tas = this.tas;
        }

        return json;
    }

    static fromJSON(json: YearlyMeanByDayJSON): YearlyMeanByDay {
        return new YearlyMeanByDay(json.stationId, json.tasmin, json.tasmax, json.tas);
    }
}

export type YearlyMeanByDayByStationId = Record<string, YearlyMeanByDayJSON>;
