import { useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import * as d3 from 'd3';
import MapTooltip from './MapTooltip';
import { MAP_ZOOM_LEVEL, MAP_CENTER, MAP_DIMENSIONS, PREDEFINED_CITIES } from '../../constants/map';
import { getAnomalyColor } from '../../utils/TemperatureUtils';
import { selectCity } from '../../store/slices/selectedCitySlice';
import './StationMarkers.css';

// Helper function to check if two cities are the same
const isSameCity = (city1, city2) => {
    if (!city1 || !city2) return false;
    return city1.city_name === city2.city_name &&
        city1.lat === city2.lat &&
        city1.lon === city2.lon;
};

const StationMarkers = () => {
    const dispatch = useDispatch();
    const cities = useSelector(state => state.cities);
    const selectedCity = useSelector(state => state.selectedCity);
    const rememberedCities = useSelector(state => state.rememberedCities);

    const markersRef = useRef(null);
    const tooltipRef = useRef(null);

    // Use useCallback to memoize the handleCitySelect function
    const handleCitySelect = useCallback((city) => {
        const isPredefined = PREDEFINED_CITIES.includes(city.city_name);
        dispatch(selectCity(city, isPredefined));
    }, [dispatch]);

    useEffect(() => {
        if (!cities || !cities.length || !markersRef.current) return;

        // Clear previous content
        d3.select(markersRef.current).selectAll("*").remove();

        // Initialize tooltip if it doesn't exist
        if (!tooltipRef.current) {
            tooltipRef.current = new MapTooltip();
        }

        // Create a projection for Europe centered on Germany
        const projection = d3.geoMercator()
            .center(MAP_CENTER) // Center on Germany
            .scale(MAP_DIMENSIONS.width * MAP_ZOOM_LEVEL) // Adjust scale to fit Europe
            .translate([MAP_DIMENSIONS.width / 2, MAP_DIMENSIONS.height / 2]);

        // Filter cities to show only predefined ones, the selected city, and remembered cities
        const citiesToDisplay = cities.filter(city => {
            // Skip cities without a matched station
            if (!city.nearestStation) return false;

            // Always include the currently selected city if it exists
            if (selectedCity &&
                city.city_name === selectedCity.city_name &&
                city.lat === selectedCity.lat &&
                city.lon === selectedCity.lon) {
                return true;
            }

            // Include cities from the predefined list
            if (PREDEFINED_CITIES.includes(city.city_name)) {
                return true;
            }

            // Include cities that have been previously selected (remembered)
            if (rememberedCities.some(rememberedCity => isSameCity(rememberedCity, city))) {
                return true;
            }

            return false;
        });

        // Draw city markers
        citiesToDisplay.forEach(city => {
            // Create unique identifier for each city based on name and coordinates
            const cityId = `${city.city_name}-${city.lat}-${city.lon}`;
            const selectedCityId = selectedCity ?
                `${selectedCity.city_name}-${selectedCity.lat}-${selectedCity.lon}` : null;

            const isSelected = selectedCityId === cityId;
            const coords = projection([parseFloat(city.lon), parseFloat(city.lat)]);

            if (!coords) return; // Skip if coordinates can't be projected

            // Use anomaly from the nearest weather station
            const selectedAnomaly = Math.round(city.nearestStation.anomaly_1961_1990);

            // Determine text color class based on anomaly value
            const textColorClass = (selectedAnomaly < -6 || selectedAnomaly > 6) ? 'light-text' : 'dark-text';

            // Get color based on temperature anomaly
            const markerColor = getAnomalyColor(selectedAnomaly);

            // Check if this is a remembered city
            const isRemembered = rememberedCities.some(
                rememberedCity => isSameCity(rememberedCity, city)
            ) && !isSelected;

            const cityGroup = d3.select(markersRef.current).append("g")
                .attr("class", `city${isSelected ? " selected" : ""}${isRemembered ? " remembered" : ""}`)
                .attr("transform", `translate(${coords[0]}, ${coords[1]})`)
                .style("cursor", "pointer")
                .attr("data-city-id", cityId);

            // Add circle for city - make it bigger to fit the text
            cityGroup.append("circle")
                .attr("r", isSelected ? 20 : 16)
                .attr("fill", markerColor)
                .attr("stroke", "#FFFFFF")
                .attr("stroke-width", 2);

            // Add text for the temperature anomaly using the appropriate class
            cityGroup.append("text")
                .attr("class", textColorClass)
                .attr("style", `font-size: ${isSelected ? 1.2 : 0.9}em;`)
                .text(`${selectedAnomaly.toFixed(0)}`);

            // Add event handlers
            cityGroup
                .on("mouseover", function (event) {
                    // Get the actual screen coordinates of the marker
                    const boundingRect = this.getBoundingClientRect();
                    const markerX = boundingRect.x + boundingRect.width / 2;
                    const markerY = boundingRect.y;

                    // Enlarge the circle on hover
                    if (!isSelected) {
                        d3.select(this).select("circle").transition().duration(10).attr("r", 20);
                        d3.select(this).select("text").transition().duration(10).style("font-size", "1.2em");
                    }

                    tooltipRef.current.show(city, markerX, markerY);
                })
                .on("mouseout", function () {
                    // Return to original size if not selected
                    if (!isSelected) {
                        d3.select(this).select("circle").transition().duration(10).attr("r", 16);
                        d3.select(this).select("text").transition().duration(10).style("font-size", "0.9em");
                    }

                    tooltipRef.current.hide();
                })
                .on("click", function () {
                    setTimeout(() => {
                        tooltipRef.current.hide();
                    }, 1000);
                    handleCitySelect(city);
                });
        });

    }, [cities, selectedCity, rememberedCities, dispatch, handleCitySelect]);

    // Clean up tooltip when component unmounts
    useEffect(() => {
        return () => {
            if (tooltipRef.current) {
                tooltipRef.current.destroy();
                tooltipRef.current = null;
            }
        };
    }, []);

    return <g ref={markersRef}></g>;
};

export default StationMarkers;
