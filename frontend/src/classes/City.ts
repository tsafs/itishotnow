/**
 * @class City
 * Represents a city with its metadata.
 */
export default class City {
    id: string;
    name: string;
    lat: number;
    lon: number;
    stationId: string | null;
    distanceToStation: number | null;

    /**
     * @param {string} id
     * @param {string} name
     * @param {number} lat
     * @param {number} lon
     * @param {string|null} stationId
     * @param {number|null} distanceToStation
     */
    constructor(
        id: string,
        name: string,
        lat: number,
        lon: number,
        stationId: string | null = null,
        distanceToStation: number | null = null
    ) {
        this.id = id;
        this.name = name;
        this.lat = lat;
        this.lon = lon;
        this.stationId = stationId;
        this.distanceToStation = distanceToStation;
    }

    toJSON(): {
        id: string;
        name: string;
        lat: number;
        lon: number;
        stationId: string | null;
        distanceToStation: number | null;
    } {
        return {
            id: this.id,
            name: this.name,
            lat: this.lat,
            lon: this.lon,
            stationId: this.stationId,
            distanceToStation: this.distanceToStation
        };
    }

    static fromJSON(obj: {
        id: string;
        name: string;
        lat: number;
        lon: number;
        stationId: string | null;
        distanceToStation: number | null;
    }): City {
        return new City(obj.id, obj.name, obj.lat, obj.lon, obj.stationId, obj.distanceToStation);
    }
}