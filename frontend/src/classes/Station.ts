/**
 * Shape for a serialized station.
 */
export interface IStation {
    readonly id: string;
    readonly name: string;
    readonly elevation: number;
    readonly lat: number;
    readonly lon: number;
    equals(other: IStation): boolean;
}

export interface StationJSON {
    readonly id: string;
    readonly name: string;
    readonly elevation: number;
    readonly lat: number;
    readonly lon: number;
}

/**
 * Represents a weather station's metadata.
 */
export default class Station implements IStation {
    public readonly id: string;
    public readonly name: string;
    public readonly elevation: number;
    public readonly lat: number;
    public readonly lon: number;

    constructor(id: string, name: string, elevation: number, lat: number, lon: number) {
        this.id = id;
        this.name = name;
        this.elevation = elevation;
        this.lat = lat;
        this.lon = lon;
    }

    equals(other: IStation): boolean {
        return this.id === other.id;
    }

    toJSON(): StationJSON {
        return {
            id: this.id,
            name: this.name,
            elevation: this.elevation,
            lat: this.lat,
            lon: this.lon,
        };
    }

    static fromJSON(obj: StationJSON): Station {
        return new Station(obj.id, obj.name, obj.elevation, obj.lat, obj.lon);
    }
}