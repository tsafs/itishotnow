export interface CityJSON {
    id: string;
    name: string;
    lat: number;
    lon: number;
    stationId?: string;
    distanceToStation?: number;
}

export interface ICity {
    id: string;
    name: string;
    lat: number;
    lon: number;
    stationId: string | undefined;
    distanceToStation: number | undefined;
    equals(other: ICity): boolean;
}

/**
 * Immutable City aggregate used across the frontend.
 */
export default class City implements ICity {
    public readonly id: string;
    public readonly name: string;
    public readonly lat: number;
    public readonly lon: number;
    public readonly stationId: string | undefined;
    public readonly distanceToStation: number | undefined;

    constructor(
        id: string,
        name: string,
        lat: number,
        lon: number,
        stationId?: string,
        distanceToStation?: number,
    ) {
        this.id = id;
        this.name = name;
        this.lat = lat;
        this.lon = lon;
        this.stationId = stationId;
        this.distanceToStation = distanceToStation;
    }

    withNearestStation(stationId: string, distanceToStation: number): City {
        return new City(this.id, this.name, this.lat, this.lon, stationId, distanceToStation);
    }

    equals(other: ICity): boolean {
        return this.id === other.id;
    }

    toJSON(): CityJSON {
        const json: CityJSON = {
            id: this.id,
            name: this.name,
            lat: this.lat,
            lon: this.lon,
        };

        if (this.stationId !== undefined) {
            json.stationId = this.stationId;
        }

        if (this.distanceToStation !== undefined) {
            json.distanceToStation = this.distanceToStation;
        }

        return json;
    }

    static fromJSON(json: CityJSON): City {
        return new City(
            json.id,
            json.name,
            json.lat,
            json.lon,
            json.stationId ?? undefined,
            json.distanceToStation ?? undefined,
        );
    }
}

export type CityDictionary = Record<string, City>;