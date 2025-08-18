import { getNow } from "../utils/dateUtils";
import XYData from "../classes/XYData"; // Ensure this import exists

/**
 * Service to fetch ice and hot days data for a station from JSON file
 * @param {string} stationId - station ID of a station to fetch data for
 * @returns {Promise<{daysBelow0Tmax: XYData, daysAbove30Tmax: XYData}>} Historical data for station
 */
export const fetchIceAndHotDaysForStation = async (stationId) => {
    try {
        // Get today's date in YYYYMMDD format using Luxon
        const today = getNow();
        const cacheBuster = today.toFormat('yyyyLLdd');

        const url = `/data/ice_and_hot_days/${stationId}_ice_and_hot_days_historical.json?t=${cacheBuster}`;

        const response = await fetch(url);

        // in case of a 404 error, error out
        if (!response.ok) {
            throw new Error(`Failed to fetch data from ${url}: ${response.status} ${response.statusText}.`);
        }

        const json = await response.json();

        // Validate JSON structure
        if (
            !json.daysBelow0Tmax ||
            !json.daysAbove30Tmax ||
            !Array.isArray(json.daysBelow0Tmax.x) ||
            !Array.isArray(json.daysBelow0Tmax.y) ||
            !Array.isArray(json.daysAbove30Tmax.x) ||
            !Array.isArray(json.daysAbove30Tmax.y)
        ) {
            throw new Error(`Invalid JSON structure for station ${stationId}.`);
        }

        // Create XYData objects
        const daysBelow0Tmax = new XYData(json.daysBelow0Tmax.x, json.daysBelow0Tmax.y);
        const daysAbove30Tmax = new XYData(json.daysAbove30Tmax.x, json.daysAbove30Tmax.y);

        return {
            daysBelow0Tmax,
            daysAbove30Tmax
        };
    } catch (error) {
        console.error(`Error loading ice and hot days data:`, error);
        throw error;
    }
};