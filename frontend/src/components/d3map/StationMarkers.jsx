import { useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import * as d3 from 'd3';
import MapTooltip from './MapTooltip';
import { MAP_ZOOM_LEVEL, MAP_CENTER, MAP_DIMENSIONS, PREDEFINED_CITIES } from '../../constants/map';
import { getAnomalyColor } from '../../utils/TemperatureUtils';
import { selectCity } from '../../store/slices/selectedCitySlice';
import { selectCityMappedData } from '../../store/slices/cityDataSlice';
import { selectInterpolatedHourlyData } from '../../store/slices/interpolatedHourlyDataSlice';
import { extractHourFromDateString } from '../../utils/dataUtils';
import './StationMarkers.css';

const StationMarkers = () => {
    const dispatch = useDispatch();
    const rememberedCityIds = useSelector(state => state.rememberedCities);
    const mappedCities = useSelector(selectCityMappedData);
    const selectedCityId = useSelector(state => state.selectedCity.cityId);
    const hourlyData = useSelector(selectInterpolatedHourlyData);

    const markersRef = useRef(null);
    const tooltipRef = useRef(null);

    // Use useCallback to memoize the handleCitySelect function
    const handleCitySelect = useCallback((city) => {
        const isPredefined = PREDEFINED_CITIES.includes(city.cityName);
        dispatch(selectCity(city.cityId, isPredefined));
    }, [dispatch]);

    useEffect(() => {
        if (!mappedCities || !hourlyData || !markersRef.current) return;

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
        const citiesToDisplay = Object.values(mappedCities).filter(item => {
            // Always include the currently selected city if it exists
            if (item.city.cityId === selectedCityId) {
                return true;
            }

            // Include cities from the predefined list
            if (PREDEFINED_CITIES.includes(item.city.cityName)) {
                return true;
            }

            // Include cities that have been previously selected (remembered)
            if (rememberedCityIds.some(id => id === item.city.cityId)) {
                return true;
            }

            return false;
        });

        // Draw city markers
        citiesToDisplay.forEach(item => {
            const isSelected = selectedCityId === item.city.cityId;

            const coords = projection([parseFloat(item.city.lon), parseFloat(item.city.lat)]);

            if (!coords) return; // Skip if coordinates can't be projected

            // Calculate anomaly value
            const hour = extractHourFromDateString(item.station.data_date);
            if (!hour) return;

            const temperatureAtHour = hourlyData[item.station.station_id]?.hourlyTemps[`hour_${hour}`];
            if (temperatureAtHour === null || temperatureAtHour === undefined) return;

            const anomaly = Math.round(item.station.temperature - temperatureAtHour);

            // Determine text color class based on anomaly value
            const textColorClass = (anomaly < -6 || anomaly > 6) ? 'light-text' : 'dark-text';

            // Get color based on temperature anomaly
            const markerColor = getAnomalyColor(anomaly);

            // Check if this is a remembered city
            const isRemembered = rememberedCityIds.some(id => id === item.city.cityId) && !isSelected;

            const cityGroup = d3.select(markersRef.current).append("g")
                .attr("class", `city${isSelected ? " selected" : ""}${isRemembered ? " remembered" : ""}`)
                .attr("transform", `translate(${coords[0]}, ${coords[1]})`)
                .style("cursor", "pointer")
                .attr("data-city-id", item.city.cityId);

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
                .text(`${anomaly.toFixed(0)}`);

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

                    tooltipRef.current.show(item.city.cityName, markerX, markerY);
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
                    handleCitySelect(item.city);
                });
        });

    }, [mappedCities, hourlyData, selectedCityId, rememberedCityIds, dispatch, handleCitySelect]);

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
