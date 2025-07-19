/**
 * Service to fetch historical average data for a specific day (month and day)
 * @param {string|number} month - Month in MM format (01-12)
 * @param {string|number} day - Day in DD format (01-31)
 * @returns {Promise<Array>} Array of historical data objects by station
 */
export const fetchHistoricalDataForDay = async (month, day) => {
    try {
        // Format month and day to ensure they have leading zeros
        const formattedMonth = String(month).padStart(2, '0');
        const formattedDay = String(day).padStart(2, '0');

        const url = `/data/yearly_mean_by_day/1961_1990/${formattedMonth}_${formattedDay}.csv`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch historical data: ${response.status} ${response.statusText}`);
        }

        const text = await response.text();
        const lines = text.split('\n');

        // Parse CSV data into array of objects
        const data = lines.slice(1).map(line => {
            if (!line.trim()) return null; // Skip empty lines

            const [station_id, tasmin, tasmax, tas] = line.split(',').map(col => col.trim());

            if (!station_id) return null;

            return {
                station_id: station_id,
                tasmin: parseFloat(tasmin),
                tasmax: parseFloat(tasmax),
                tas: parseFloat(tas)
            };
        }).filter(Boolean); // Remove null entries

        // Convert data to dictionary
        let result = {};
        for (let item of data) {
            result[item.station_id] = item;
        }

        return result;
    } catch (error) {
        console.error(`Error loading historical data for day ${month}/${day}:`, error);
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
 * Service to fetch interpolated hourly historical temperature data for a specific day
 * @param {string|number} month - Month in MM format (01-12)
 * @param {string|number} day - Day in DD format (01-31)
 * @returns {Promise<Array>} Array of hourly historical temperature data objects by station
 */
export const fetchInterpolatedHourlyData = async (month, day) => {
    try {
        // Format month and day to ensure they have leading zeros
        const formattedMonth = String(month).padStart(2, '0');
        const formattedDay = String(day).padStart(2, '0');

        const url = `/data/interpolated_hourly/1961_1990/interpolated_hourly_temperatures_1961_1990_${formattedMonth}_${formattedDay}.csv`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch interpolated hourly data: ${response.status} ${response.statusText}`);
        }

        const text = await response.text();
        const lines = text.split('\n');

        // Parse CSV header to get hour columns
        const header = lines[0].split(',');

        // Parse CSV data into array of objects
        const data = lines.slice(1).map(line => {
            if (!line.trim()) return null; // Skip empty lines

            const values = line.split(',').map(val => val.trim());
            if (!values[0]) return null; // Skip if no station_id

            const stationId = values[0];
            const hourlyData = {};

            // Map each hour column to its value
            for (let i = 1; i < header.length; i++) {
                const hourKey = header[i];
                hourlyData[hourKey] = parseFloat(values[i]);
            }

            return {
                stationId: stationId,
                hourlyTemps: hourlyData
            };
        }).filter(Boolean); // Remove null entries

        // Convert data to dictionary
        let result = {};
        for (let item of data) {
            result[item.stationId] = item;
        }

        return result;
    } catch (error) {
        console.error(`Error loading interpolated hourly data for day ${month}/${day}:`, error);
        throw error;
    }
};