import { v4 as uuidv4 } from 'uuid';
import type { ICity } from '../classes/City.js';
import type { IStation } from '../classes/Station.js';

/**
 * Service to fetch German cities from CSV file
 * @returns {Promise<Array>} Array of city data objects
 */
export const fetchGermanCities = async () => {
    try {
        const url = "/german_cities_p5000.csv";
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch city data: ${response.status} ${response.statusText}`);
        }

        const text = await response.text();
        const lines = text.split('\n');

        // Skip header line and parse remaining lines
        const cities: Array<ICity | null> = lines.slice(1).map(line => {
            if (!line.trim()) return null; // Skip empty lines

            const [name, lat, lon] = line.split(',');
            if (!name || !lat || !lon) return null;

            return {
                id: uuidv4(),
                name: name.trim(),
                lat: parseFloat(lat),
                lon: parseFloat(lon)
            } as ICity;
        }).filter(Boolean); // Remove null entries

        return cities as Array<ICity>;
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
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
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
 * @param {Array} cities - Array of city objects
 * @param {Object} stations - Dictionary of stationId -> station
 * @returns {Array} Cities with nearest station information
 */
export const findClosestWeatherStationsForCities = (cities: Record<string, ICity>, stations: Record<string, IStation>) => {
    if (Object.keys(stations).length === 0) {
        console.warn("No stations available to find nearest for cities");
        return cities; // Return original cities if no stations available
    }

    const result: Record<string, ICity> = {};
    Object.values(cities).forEach(city => {
        // Default to first station
        const firstStation = Object.values(stations)[0] as IStation;
        let nearestStation: IStation = firstStation;
        let minDistance = calculateDistance(
            city.lat, city.lon,
            firstStation.lat, firstStation.lon
        );;

        // Find the nearest station for this city
        Object.values(stations).forEach((station: IStation) => {
            // Some stations might have invalid coordinates
            if (isNaN(station.lat) || isNaN(station.lon)) {
                return;
            }

            const distance = calculateDistance(
                city.lat, city.lon,
                station.lat, station.lon
            );

            if (distance < minDistance) {
                minDistance = distance;
                nearestStation = station;
            }
        });

        // Create a copy of the city with nearest station info
        result[city.id] = {
            id: city.id,
            name: city.name,
            lat: city.lat,
            lon: city.lon,
            stationId: nearestStation.id,
            distanceToStation: minDistance
        } as ICity;
    });

    return result;
};