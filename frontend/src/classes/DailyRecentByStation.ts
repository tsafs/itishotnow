export interface IDailyRecentByStation {
    readonly stationId: string;
    readonly date: string;
    readonly meanTemperature: number | undefined;
    readonly minTemperature: number | undefined;
    readonly maxTemperature: number | undefined;
    readonly meanHumidity: number | undefined;
    equals(other: IDailyRecentByStation): boolean;
}

export interface DailyRecentByStationJSON {
    stationId: string;
    date: string;
    meanTemperature?: number;
    minTemperature?: number;
    maxTemperature?: number;
    meanHumidity?: number;
}

export type IStationData = DailyRecentByStationJSON;

export interface IStationDataByDate {
    [date: string]: IStationData;
}

export interface IStationDataByStationId {
    [stationId: string]: IStationData;
}

/**
 * Represents aggregated daily data for a station.
 */
export default class DailyRecentByStation implements IDailyRecentByStation {
    public readonly stationId: string;
    public readonly date: string;
    public readonly meanTemperature: number | undefined;
    public readonly minTemperature: number | undefined;
    public readonly maxTemperature: number | undefined;
    public readonly meanHumidity: number | undefined;

    constructor(
        stationId: string,
        date: string,
        meanTemperature?: number,
        minTemperature?: number,
        maxTemperature?: number,
        meanHumidity?: number
    ) {
        this.stationId = stationId;
        this.date = date;
        this.meanTemperature = meanTemperature;
        this.minTemperature = minTemperature;
        this.maxTemperature = maxTemperature;
        this.meanHumidity = meanHumidity;
    }

    equals(other: IDailyRecentByStation): boolean {
        return (
            this.stationId === other.stationId &&
            this.date === other.date &&
            this.meanTemperature === other.meanTemperature &&
            this.minTemperature === other.minTemperature &&
            this.maxTemperature === other.maxTemperature &&
            this.meanHumidity === other.meanHumidity
        );
    }

    toJSON(): DailyRecentByStationJSON {
        const json: DailyRecentByStationJSON = {
            stationId: this.stationId,
            date: this.date,
        };

        if (this.meanTemperature !== undefined) {
            json.meanTemperature = this.meanTemperature;
        }
        if (this.minTemperature !== undefined) {
            json.minTemperature = this.minTemperature;
        }
        if (this.maxTemperature !== undefined) {
            json.maxTemperature = this.maxTemperature;
        }
        if (this.meanHumidity !== undefined) {
            json.meanHumidity = this.meanHumidity;
        }

        return json;
    }

    static fromJSON(obj: DailyRecentByStationJSON): DailyRecentByStation {
        return new DailyRecentByStation(
            obj.stationId,
            obj.date,
            obj.meanTemperature,
            obj.minTemperature,
            obj.maxTemperature,
            obj.meanHumidity
        );
    }
}