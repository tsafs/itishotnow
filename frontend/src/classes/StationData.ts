export interface IStationData {
    readonly stationId: string;
    readonly date: string;
    readonly temperature: number | undefined;
    readonly minTemperature: number | undefined;
    readonly maxTemperature: number | undefined;
    readonly humidity: number | undefined;
    equals(other: IStationData): boolean;
}

export interface StationDataJSON {
    stationId: string;
    date: string;
    temperature?: number;
    minTemperature?: number;
    maxTemperature?: number;
    humidity?: number;
}

/**
 * Represents climate data for a station.
 */
export default class StationData implements IStationData {
    public readonly stationId: string;
    public readonly date: string;
    public readonly temperature: number | undefined;
    public readonly minTemperature: number | undefined;
    public readonly maxTemperature: number | undefined;
    public readonly humidity: number | undefined;

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

    equals(other: IStationData): boolean {
        return (
            this.stationId === other.stationId &&
            this.date === other.date &&
            this.temperature === other.temperature &&
            this.minTemperature === other.minTemperature &&
            this.maxTemperature === other.maxTemperature &&
            this.humidity === other.humidity
        );
    }

    toJSON(): StationDataJSON {
        const json: StationDataJSON = {
            stationId: this.stationId,
            date: this.date,
        };

        if (this.temperature !== undefined) {
            json.temperature = this.temperature;
        }
        if (this.minTemperature !== undefined) {
            json.minTemperature = this.minTemperature;
        }
        if (this.maxTemperature !== undefined) {
            json.maxTemperature = this.maxTemperature;
        }
        if (this.humidity !== undefined) {
            json.humidity = this.humidity;
        }

        return json;
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