/**
 * Interface representing daily recent weather data by station.
 */
export interface IDailyRecentByStation {
    /** Unique identifier for the station */
    stationId: string;
    /** Date of the weather data (YYYYMMDD) */
    date: string;
    /** Mean temperature for the day */
    temperature_mean: number;
    /** Minimum temperature for the day */
    temperature_min: number;
    /** Maximum temperature for the day */
    temperature_max: number;
    /** Mean humidity for the day */
    humidity_mean: number;
}

/**
 * Dictionary of daily recent weather data by date.
 * The key is the date string, and the value is the weather data for that date.
 */
export interface IDailyRecentByStationDict {
    [date: string]: IDailyRecentByStation;
}