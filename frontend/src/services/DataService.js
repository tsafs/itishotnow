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