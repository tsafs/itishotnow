export interface CityJSON {
    id: string;
    name: string;
    lat: number;
    lon: number;
    stationId?: string | null;
    distanceToStation?: number | null;
}

export interface ICity {
    id: string;
    name: string;
    lat: number;
    lon: number;
    stationId: string | null;
    distanceToStation: number | null;
}

/**
 * Immutable City aggregate used across the frontend.
 */
export default class City implements ICity {
    public readonly id: string;
    public readonly name: string;
    public readonly lat: number;
    public readonly lon: number;
    public readonly stationId: string | null;
    public readonly distanceToStation: number | null;

    constructor(
        id: string,
        name: string,
        lat: number,
        lon: number,
        stationId: string | null = null,
        distanceToStation: number | null = null,
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

    toJSON(): CityJSON {
        return {
            id: this.id,
            name: this.name,
            lat: this.lat,
            lon: this.lon,
            stationId: this.stationId,
            distanceToStation: this.distanceToStation,
        } satisfies CityJSON;
    }

    static fromJSON(json: CityJSON): City {
        return new City(
            json.id,
            json.name,
            json.lat,
            json.lon,
            json.stationId ?? null,
            json.distanceToStation ?? null,
        );
    }
}

export type CityDictionary = Record<string, City>;