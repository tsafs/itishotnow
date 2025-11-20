export interface StationDataJSON {
    stationId: string;
    date: string;
    temperature?: number | undefined;
    minTemperature?: number | undefined;
    maxTemperature?: number | undefined;
    humidity?: number | undefined;
}

/**
 * Represents climate data for a station.
 */
export default class StationData {
    public readonly stationId: string;
    public readonly date: string;
    public readonly temperature?: number | undefined;
    public readonly minTemperature?: number | undefined;
    public readonly maxTemperature?: number | undefined;
    public readonly humidity?: number | undefined;

    constructor(
        stationId: string,
        date: string,
        temperature?: number,
        minTemperature?: number,
        maxTemperature?: number,
        humidity?: number
    ) {
        this.stationId = stationId;
        this.date = date;
        this.temperature = temperature;
        this.minTemperature = minTemperature;
        this.maxTemperature = maxTemperature;
        this.humidity = humidity;
    }

    toJSON(): StationDataJSON {
        return {
            stationId: this.stationId,
            date: this.date,
            temperature: this.temperature,
            minTemperature: this.minTemperature,
            maxTemperature: this.maxTemperature,
            humidity: this.humidity,
        };
    }

    static fromJSON(obj: StationDataJSON): StationData {
        return new StationData(
            obj.stationId,
            obj.date,
            obj.temperature,
            obj.minTemperature,
            obj.maxTemperature,
            obj.humidity
        );
    }
}