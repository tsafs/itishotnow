/**
 * @class City
 * Represents a city with its metadata.
 */
export default class City {

    /**
     * @param {string} id
     * @param {string} name
     * @param {number} lat
     * @param {number} lon
     * @param {string|null} stationId
     * @param {number|null} distanceToStation
     */
    constructor(id, name, lat, lon, stationId = null, distanceToStation = null) {
        this.id = id;
        this.name = name;
        this.lat = lat;
        this.lon = lon;
        this.stationId = stationId;
        this.distanceToStation = distanceToStation;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            lat: this.lat,
            lon: this.lon,
            stationId: this.stationId,
            distanceToStation: this.distanceToStation
        };
    }

    static fromJSON(obj) {
        return new City(obj.id, obj.name, obj.lat, obj.lon, obj.stationId, obj.distanceToStation);
    }
}