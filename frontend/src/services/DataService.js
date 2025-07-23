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