import type { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';

export type GermanyBoundaryGeoJSON = FeatureCollection<Geometry, GeoJsonProperties>;

/**
 * Service to fetch Germany GeoJSON boundaries.
 * 
 * @return {Promise<GermanyBoundaryGeoJSON>} Germany GeoJSON boundaries
 */
export const fetchGermanyGeoJSON = async (): Promise<GermanyBoundaryGeoJSON> => {
    try {
        const url = "/germany_10m_admin_0_reduced.json";
        const response = await fetch(url);
        const data = await response.json();
        return data as GermanyBoundaryGeoJSON;
    } catch (error) {
        console.error("Error loading Germany GeoJSON boundaries:", error);
        throw error;
    }
};