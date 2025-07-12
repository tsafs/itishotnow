import { getNow } from "../utils/dateUtils";

/**
 * Service to fetch weather stations data from CSV file
 * @returns {Promise<Array>} Array of station data objects
 */
export const fetchLatestWeatherStationsData = async () => {
    try {
        // Get today's date in YYYYMMDD format
        const today = getNow();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const day = String(today.getDate()).padStart(2, '0');
        const hour = String(today.getHours()).padStart(2, '0'); // Get current hour (00-23)
        let year_month_day = `${year}${month}${day}`;

        const url = `/station_data/10min_station_data_${year_month_day}_with_hist_means.csv?t=${year}${month}${day}${hour}`;

        const response = await fetch(url, { cache: 'no-store' });

        // in case of a 404 error, error out
        if (!response.ok) {
            throw new Error(`Failed to fetch data from ${url}: ${response.status} ${response.statusText}. Are you in the wrong timezone? Our data is based on UTC.`);
        }

        const text = await response.text();

        const lines = text.split('\n');

        // Parse CSV data into array of station objects
        const data = lines.slice(1).map(line => {
            if (!line.trim()) return null; // Skip empty lines

            // Custom parsing to handle commas within quoted fields
            const cols = [];
            let currentValue = '';
            let inQuotes = false;

            for (let i = 0; i < line.length; i++) {
                const char = line[i];

                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    cols.push(currentValue);
                    currentValue = '';
                } else {
                    currentValue += char;
                }
            }
            cols.push(currentValue); // Add the last column

            if (cols.length < 13) return null; // Ensure we have all required columns

            // Remove trailing commas and clean station name
            const stationName = cols[1].replace(/,\s*$/, '').replace(/^"|"$/g, '');

            // Parse date from mm.dd.yyyy HH:MM to dd.mm.yyyy HH:MM
            let dateString = cols[2];
            if (dateString) {
                const dateParts = dateString.match(/(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}:\d{2})/);
                if (dateParts) {
                    const [, month, day, year, time] = dateParts;
                    dateString = `${day}.${month}.${year}\u00A0${time}`;
                }
            }

            const replaceWithUndefined = (value) => {
                if (value === -999) {
                    return undefined;
                } else {
                    return value;
                }
            }

            const temperature = replaceWithUndefined(parseFloat(cols[9]));
            const hist_mean_1961_1990 = (parseFloat(cols[10]));
            const hist_mean_1971_2000 = (parseFloat(cols[11]));
            const hist_mean_1981_2010 = (parseFloat(cols[12]));

            return {
                station_id: cols[0].replace(/^0+/, ''), // Remove leading zeros
                station_name: stationName,
                data_date: dateString,
                elevation: parseFloat(cols[3]),
                station_lat: parseFloat(cols[4]), // Using city_lat for compatibility with CityMarker
                station_lon: parseFloat(cols[5]), // Using city_lon for compatibility with CityMarker
                temperature: temperature,
                min_temperature: replaceWithUndefined(parseFloat(cols[8])),
                max_temperature: replaceWithUndefined(parseFloat(cols[7])),
                humidity: replaceWithUndefined(parseFloat(cols[6])),
                hist_mean_1961_1990: hist_mean_1961_1990,
                hist_mean_1971_2000: hist_mean_1971_2000,
                hist_mean_1981_2010: hist_mean_1981_2010,
                subtitle: `${cols[2] ? cols[2] + ' Uhr' : 'unbekannt'}`,
                // Calculate temperature anomaly from 1961-1990 baseline
                anomaly_1961_1990: temperature !== undefined ? temperature - hist_mean_1961_1990 : undefined,
                anomaly_1971_2000: temperature !== undefined ? temperature - hist_mean_1971_2000 : undefined,
                anomaly_1981_2010: temperature !== undefined ? temperature - hist_mean_1981_2010 : undefined
            };
        }).filter(Boolean); // Remove null entries

        return data;
    } catch (error) {
        console.error(`Error loading weather stations data:`, error);
        throw error;
    }
};
/**
 * Service to fetch daily weather station data from CSV file
 * @param {string} station_id - station ID of a station to fetch data for
 * @param {string} year_month_day - date in YYYYMMDD format to fetch data for
 * @returns {Promise<Array>} Array of station data objects
 */
export const fetchDailyWeatherStationData = async (station_id, year_month_day) => {
    try {
        const url = `/data/daily_recent_by_station/${station_id}.csv`;

        const response = await fetch(url, { cache: 'no-store' });

        // in case of a 404 error, error out
        if (!response.ok) {
            throw new Error(`Failed to fetch data from ${url}: ${response.status} ${response.statusText}.`);
        }

        const text = await response.text();

        const lines = text.split('\n');

        let result = null;

        lines.slice(1).forEach(line => {
            if (!line.trim()) return null; // Skip empty lines

            const cols = line.split(',').map(col => col.trim());

            const date = cols[0];
            const temperature_mean = parseFloat(cols[1]);
            const temperature_min = parseFloat(cols[2]);
            const temperature_max = parseFloat(cols[3]);
            const humidity_mean = parseFloat(cols[4]);

            if (date === year_month_day) {
                result = {
                    station_id: station_id,
                    date: new Date(date),
                    mean_temperature: isNaN(temperature_mean) ? undefined : temperature_mean,
                    min_temperature: isNaN(temperature_min) ? undefined : temperature_min,
                    max_temperature: isNaN(temperature_max) ? undefined : temperature_max,
                    mean_humidity: isNaN(humidity_mean) ? undefined : humidity_mean
                };
            }
        });

        if (!result) {
            throw new Error(`No data found for station ${station_id} on ${year_month_day}.`);
        }

        return result;
    } catch (error) {
        console.error(`Error loading daily weather stations data:`, error);
        throw error;
    }
};

/**
 * Service to fetch Europe's boundary TopoJSON data
 * @returns {Promise<Object>} TopoJSON data for Europe's boundaries
 */
export const fetchEuropeTopoJSON = async () => {
    try {
        const url = "/europe.50.topojson";
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error loading Europe TopoJSON boundaries:", error);
        throw error;
    }
};


/**
 * Service to fetch weather stations data from a remote CSV file, specifically for rolling averages.
 * @param {string} station_id - station ID of a station to filter data by
 * @returns {Promise<Array>} Array of station data objects
 */
export const fetchRollingAverageForStation = async (station_id) => {
    try {
        // Construct the URL for the rolling average data
        const url = `/data/rolling_average/1951_2024/daily/${station_id}_1951-2024_avg_7d.csv`;

        const response = await fetch(url);

        // in case of a 404 error, error out
        if (!response.ok) {
            throw new Error(`Failed to fetch rolling average data for ${station_id} from 1951 to 2024: ${response.status} ${response.statusText}. Are you in the wrong timezone? Our data is based on UTC.`);
        }

        const text = await response.text();

        const lines = text.split('\n');

        // Parse CSV data into array of station objects
        let data = lines.slice(1).map(line => {
            if (!line.trim()) return null; // Skip empty lines

            const cols = line.split(',').map(col => col.trim());

            // Extract date components
            const dateParts = cols[0].split('-');
            if (dateParts.length < 3) return null;

            return {
                date: cols[0],
                tas: parseFloat(cols[1]),
            };
        }).filter(Boolean); // Remove null entries

        if (data.length === 0) {
            throw new Error(`No data found for ${station_id} from 1951 to 2024.`);
        }

        return data;
    } catch (error) {
        console.error(`Error loading rolling average data for ${station_id} from 1951 to 2024:`, error);
        throw error;
    }
};

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

            const [city_name, lat, lon] = line.split(',');
            if (!city_name || !lat || !lon) return null;

            return {
                city_name: city_name.trim(),
                lat: parseFloat(lat),
                lon: parseFloat(lon),
                // This will be filled with nearest station data later
                nearestStation: null,
                distanceToStation: null
            };
        }).filter(Boolean); // Remove null entries

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
            anomaly_1971_2000: nearestStation?.anomaly_1971_2000,
            anomaly_1981_2010: nearestStation?.anomaly_1981_2010,
            data_date: nearestStation?.data_date,
            subtitle: `${nearestStation?.data_date ? nearestStation.data_date + ' Uhr' : 'unbekannt'}`
        };
    });
};