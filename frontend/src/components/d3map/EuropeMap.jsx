import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { MAP_ZOOM_LEVEL, MAP_CENTER, MAP_DIMENSIONS } from '../../constants/map';
import { fetchEuropeTopoJSON } from '../../services/DataService';

const EuropeMap = () => {
    const [mapData, setMapData] = useState(null);
    const mapGroupRef = useRef(null);

    // Fetch TopoJSON data when component mounts
    useEffect(() => {
        const loadData = async () => {
            try {
                const topoData = await fetchEuropeTopoJSON();
                const geoData = topojson.feature(topoData, topoData.objects.europe);
                setMapData(geoData);
            } catch (error) {
                console.error("Failed to load map data:", error);
            }
        };

        loadData();
    }, []);

    useEffect(() => {
        if (!mapData || !mapGroupRef.current) return;

        // Clear previous content
        d3.select(mapGroupRef.current).selectAll("*").remove();

        // Create a projection for Europe centered on Germany
        const projection = d3.geoMercator()
            .center(MAP_CENTER) // Center on Germany
            .scale(MAP_DIMENSIONS.width * MAP_ZOOM_LEVEL) // Adjust scale to fit Europe
            .translate([MAP_DIMENSIONS.width / 2, MAP_DIMENSIONS.height / 2]);

        // Create a path generator
        const path = d3.geoPath().projection(projection);

        // Filter for only Germany
        const germanyFeature = mapData.features.filter(d =>
            d.properties.ISO3 === "DEU" ||
            d.properties.NAME === "Germany"
        );

        // Draw only Germany
        d3.select(mapGroupRef.current)
            .selectAll("path.country")
            .data(germanyFeature)
            .enter()
            .append("path")
            .attr("class", "country")
            .attr("d", path)
            .attr("fill", "#fefefe")
            .attr("stroke", "#bbb")
            .attr("stroke-width", 1);

    }, [mapData]);

    return <>
        {mapData && (
            <g ref={mapGroupRef}></g>
        )}
    </>;
};

export default EuropeMap;
