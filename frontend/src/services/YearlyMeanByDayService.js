/**
 * Service to fetch historical average data for a specific day (month and day)
 * @param {string|number} month - Month in MM format (01-12)
 * @param {string|number} day - Day in DD format (01-31)
 * @returns {Promise<Array>} Array of historical data objects by station
 */
export const fetchYearlyMeanByDayData = async (month, day) => {
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
                tasmin: parseFloat(tasmin) || undefined,
                tasmax: parseFloat(tasmax) || undefined,
                tas: parseFloat(tas) || undefined
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