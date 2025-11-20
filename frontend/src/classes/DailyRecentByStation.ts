export interface DailyRecentByStationJSON {
    stationId: string;
    date: string;
    meanTemperature?: number | undefined;
    minTemperature?: number | undefined;
    maxTemperature?: number | undefined;
    meanHumidity?: number | undefined;
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
export default class DailyRecentByStation {
    public readonly stationId: string;
    public readonly date: string;
    public readonly meanTemperature?: number | undefined;
    public readonly minTemperature?: number | undefined;
    public readonly maxTemperature?: number | undefined;
    public readonly meanHumidity?: number | undefined;

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

    toJSON(): DailyRecentByStationJSON {
        return {
            stationId: this.stationId,
            date: this.date,
            meanTemperature: this.meanTemperature,
            minTemperature: this.minTemperature,
            maxTemperature: this.maxTemperature,
            meanHumidity: this.meanHumidity,
        };
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