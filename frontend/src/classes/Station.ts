/**
 * @interface IStation
 * Represents a weather station's metadata.
 */
export interface IStation {
    id: string;
    name: string;
    elevation: number;
    lat: number;
    lon: number;
}