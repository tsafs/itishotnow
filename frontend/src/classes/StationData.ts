/**
 * @class StationData
 * Represents climate data for a station.
 */
export default class StationData {
    /**
     * @param {string} stationId
     * @param {string} dataDate
     * @param {number|undefined} temperature
     * @param {number|undefined} minTemperature
     * @param {number|undefined} maxTemperature
     * @param {number|undefined} humidity
     */
    constructor(stationId, date, temperature, minTemperature, maxTemperature, humidity) {
        this.stationId = stationId;
        this.date = date;
        this.temperature = temperature;
        this.minTemperature = minTemperature;
        this.maxTemperature = maxTemperature;
        this.humidity = humidity;
    }

    toJSON() {
        return {
            stationId: this.stationId,
            date: this.date,
            temperature: this.temperature,
            minTemperature: this.minTemperature,
            maxTemperature: this.maxTemperature,
            humidity: this.humidity,
        };
    }

    static fromJSON(obj) {
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