/**
 * @interface ICity
 * Represents a city with its metadata.
 */
export interface ICity {
    id: string;
    name: string;
    lat: number;
    lon: number;
    stationId: string | null;
    distanceToStation: number | null;
}