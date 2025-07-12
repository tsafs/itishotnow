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
 * @param {Array} stations - Array of weather station objects
 * @returns {Array} Cities with nearest station information
 */
export const findNearestStationsForCities = (cities, stations) => {
    return cities.map(city => {
        let nearestStation = null;
        let minDistance = Infinity;

        // Find the nearest station for this city
        stations.forEach(station => {
            // Some stations might have invalid coordinates
            if (isNaN(station.station_lat) || isNaN(station.station_lon)) {
                return;
            }

            const distance = calculateDistance(
                city.lat, city.lon,
                station.station_lat, station.station_lon
            );

            if (distance < minDistance) {
                minDistance = distance;
                nearestStation = station;
            }
        });

        // Create a copy of the city with nearest station info
        return {
            ...city,
            nearestStation,
            distanceToStation: minDistance,
            // Add these properties for compatibility with existing components
            station_id: nearestStation?.station_id,
            station_name: city.city_name,
            station_lat: city.lat,
            station_lon: city.lon,
            temperature: nearestStation?.temperature,
            min_temperature: nearestStation?.min_temperature,
            max_temperature: nearestStation?.max_temperature,
            humidity: nearestStation?.humidity,
            anomaly_1961_1990: nearestStation?.anomaly_1961_1990,
            data_date: nearestStation?.data_date,
            subtitle: `${nearestStation?.data_date ? nearestStation.data_date + ' Uhr' : 'unbekannt'}`
        };
    });
};
