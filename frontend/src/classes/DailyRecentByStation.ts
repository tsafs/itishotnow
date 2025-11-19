/**
 * Interface representing daily recent weather data by station.
 */
export interface IStationData {
    /** Unique identifier for the station */
    stationId: string;
    /** Date of the weather data (YYYYMMDD) */
    date: string;
    /** Mean temperature for the day */
    temperatureMean: number;
    /** Minimum temperature for the day */
    temperatureMin: number;
    /** Maximum temperature for the day */
    temperatureMax: number;
    /** Mean humidity for the day */
    humidityMean: number;
}

/**
 * Dictionary of daily recent weather data by date.
 * The key is the date string, and the value is the weather data for that date.
 */
export interface IStationDataByDate {
    [date: string]: IStationData;
}

/**
 * Dictionary of daily recent weather data by stationId.
 * The key is the stationId, and the value is the weather data for that station.
 */
export interface IStationDataByStationId {
    [stationId: string]: IStationData;
}