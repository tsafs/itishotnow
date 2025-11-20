import type { Topology } from 'topojson-specification';

/**
 * Service to fetch Europe's boundary TopoJSON data.
 */
export const fetchEuropeTopoJSON = async (): Promise<Topology> => {
    try {
        const url = "/europe.50.topojson";
        const response = await fetch(url);
        const data = await response.json();
        return data as Topology;
    } catch (error) {
        console.error("Error loading Europe TopoJSON boundaries:", error);
        throw error;
    }
};