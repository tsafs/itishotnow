
/**
 * Service to fetch Germany GeoJSON boundaries
 * @returns {Promise<Object>} GeoJSON data for Germany's boundaries
 */
export const fetchGermanyGeoJSON = async () => {
    try {
        const url = "/germany_10m_admin_0_reduced.json";
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error loading Germany GeoJSON boundaries:", error);
        throw error;
    }
};