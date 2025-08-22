import { v4 as uuidv4 } from 'uuid';
import City from '../classes/City.js';

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
        const cities = lines.slice(1).map(line => {
            if (!line.trim()) return null; // Skip empty lines

            const [name, lat, lon] = line.split(',');
            if (!name || !lat || !lon) return null;

            return new City(
                uuidv4(),
                name.trim(),
                parseFloat(lat),
                parseFloat(lon)
            );
        }).filter(Boolean); // Remove null entries

        return cities as Array<City>;
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
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
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
export const findClosestWeatherStationsForCities = (cities, stations) => {
    const result = {};
    Object.values(cities).forEach(city => {
        let nearestStation = null;
        let minDistance = Infinity;

        // Find the nearest station for this city
        Object.values(stations).forEach(station => {
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
        result[city.id] = new City(
            city.id,
            city.name,
            city.lat,
            city.lon,
            nearestStation.id,
            minDistance
        );
    });

    return result;
};