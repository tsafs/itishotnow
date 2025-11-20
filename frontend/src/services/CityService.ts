import { v4 as uuidv4 } from 'uuid';
import City from '../classes/City';
import type { CityDictionary, CityJSON, ICity } from '../classes/City';
import type { IStation } from '../classes/Station';

/**
 * Service to fetch German cities from CSV file
 * 
 * Example CSV data:
 * 
 * city_name,lat,lon
 * Zwönitz,50.63027,12.80999
 * Zella-Mehlis,50.65642,10.66046
 * Bad Wünnenberg,51.52002,8.69934
 * Süßen,48.67934,9.75534
 * Brake (Unterweser),53.33333,8.48333
 * Wilhelmitor - Nord,52.2592,10.49848
 * 
 * @returns {Promise<Array>} Array of city data objects
 */
export const fetchGermanCities = async (): Promise<City[]> => {
    try {
        const url = "/german_cities_p5000.csv";
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch city data: ${response.status} ${response.statusText}`);
        }

        const text = await response.text();
        const lines = text.split('\n');

        const cities: City[] = [];
        for (const line of lines.slice(1)) {
            if (!line.trim()) continue;

            const [nameRaw, latRaw, lonRaw] = line.split(',');
            if (!nameRaw || !latRaw || !lonRaw) continue;

            const lat = Number.parseFloat(latRaw);
            const lon = Number.parseFloat(lonRaw);

            if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
                continue;
            }

            cities.push(new City(uuidv4(), nameRaw.trim(), lat, lon));
        }

        return cities;
    } catch (error) {
        console.error("Error loading German cities data:", error);
        throw error;
    }
};

/**
 * Calculates the distance between two points in kilometers using the Haversine formula
 * @param {number} lat1 - Latitude of the first point
 * @param {number} lon1 - Longitude of the first point
 * @param {number} lat2 - Latitude of the second point
 * @param {number} lon2 - Longitude of the second point
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

/**
 * Finds the nearest weather station for each city
 * @param {Array} cities - Dictionary of city objects keyed by id
 * @param {Object} stations - Dictionary of stationId -> station
 * @returns {Array} Cities with nearest station information
 */
export const findClosestWeatherStationsForCities = (
    cities: Record<string, ICity | City>,
    stations: Record<string, IStation>,
): CityDictionary => {
    const stationList = Object.values(stations).filter((station): station is IStation =>
        Number.isFinite(station.lat) && Number.isFinite(station.lon)
    );

    if (stationList.length === 0) {
        console.warn("No stations available to find nearest for cities");
        return Object.fromEntries(
            Object.values(cities).map(city => {
                const instance = city instanceof City ? city : toCityInstance(city);
                return [instance.id, instance];
            })
        );
    }

    const result: CityDictionary = {};

    for (const cityLike of Object.values(cities)) {
        const city = cityLike instanceof City ? cityLike : toCityInstance(cityLike);

        let nearestStation: IStation | null = null;
        let minDistance = Number.POSITIVE_INFINITY;

        for (const station of stationList) {
            const distance = calculateDistance(city.lat, city.lon, station.lat, station.lon);
            if (distance < minDistance) {
                minDistance = distance;
                nearestStation = station;
            }
        }

        if (!nearestStation) {
            result[city.id] = city;
            continue;
        }

        result[city.id] = city.withNearestStation(nearestStation.id, minDistance);
    }

    return result;
};

const toCityInstance = (city: ICity | CityJSON): City => {
    if (city instanceof City) {
        return city;
    }

    return new City(
        city.id,
        city.name,
        city.lat,
        city.lon,
        city.stationId ?? null,
        city.distanceToStation ?? null,
    );
};