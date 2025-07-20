/**
 * @class Station
 * Represents a weather station's metadata.
 */
export default class Station {
    /**
     * @param {string} id
     * @param {string} name
     * @param {number} elevation
     * @param {number} lat
     * @param {number} lon
     */
    constructor(id, name, elevation, lat, lon) {
        this.id = id;
        this.name = name;
        this.elevation = elevation;
        this.lat = lat;
        this.lon = lon;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            elevation: this.elevation,
            lat: this.lat,
            lon: this.lon,
        };
    }

    static fromJSON(obj) {
        return new Station(obj.id, obj.name, obj.elevation, obj.lat, obj.lon);
    }
}