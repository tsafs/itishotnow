import { useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import * as d3 from 'd3';
import MapTooltip from './MapTooltip.js';
import { MAP_ZOOM_LEVEL, MAP_CENTER, MAP_DIMENSIONS, PREDEFINED_CITIES } from '../../constants/map.js';
import { getAnomalyColor } from '../../utils/TemperatureUtils.js';
import { selectCity } from '../../store/slices/selectedCitySlice.js';
import { selectCities, selectAreCitiesCorrelated } from '../../store/slices/cityDataSlice.js';
import { selectInterpolatedHourlyData } from '../../store/slices/interpolatedHourlyDataSlice';
import { extractHourFromDateString } from '../../utils/dataUtils.js';
import { selectLiveData } from '../../store/slices/liveDataSlice.js';
import './StationMarkers.css';
import { useAppSelector } from '../../store/hooks/useAppSelector.js';

const StationMarkers = () => {
    const dispatch = useDispatch();
    const rememberedCityIds = useAppSelector(state => state.rememberedCities);
    const cities = useAppSelector(selectCities);
    const areCitiesCorrelated = useAppSelector(selectAreCitiesCorrelated);
    const selectedCityId = useAppSelector(state => state.selectedCity.cityId);
    const hourlyData = useAppSelector(selectInterpolatedHourlyData);
    const stations = useAppSelector(state => state.stations.stations);
    const liveData = useAppSelector(selectLiveData);

    const markersRef = useRef(null);
    const tooltipRef = useRef(null);

    // Use useCallback to memoize the handleCitySelect function
    const handleCitySelect = useCallback((city) => {
        const isPredefined = PREDEFINED_CITIES.includes(city.name);
        dispatch(selectCity(city.id, isPredefined));
    }, [dispatch]);

    useEffect(() => {
        if (!areCitiesCorrelated || !stations || !liveData || !hourlyData || !markersRef.current) return;

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
        const citiesToDisplay = Object.values(cities).filter(city => {
            // Always include the currently selected city if it exists
            if (city.id === selectedCityId) {
                return true;
            }

            // Include cities from the predefined list
            if (PREDEFINED_CITIES.includes(city.name)) {
                return true;
            }

            // Include cities that have been previously selected (remembered)
            if (rememberedCityIds.some(id => id === city.id)) {
                return true;
            }

            return false;
        });

        // Draw city markers
        citiesToDisplay.forEach(city => {
            const station = stations[city.stationId];
            if (!station) return;

            // Get live data for this station
            const data = liveData[station.id];
            if (!data) return;

            const isSelected = selectedCityId === city.id;

            const coords = projection([parseFloat(city.lon), parseFloat(city.lat)]);

            if (!coords) return; // Skip if coordinates can't be projected

            // Calculate anomaly value
            const hour = extractHourFromDateString(data.date);
            if (!hour) return;

            const temperatureAtHour = hourlyData[station.id]?.hourlyTemps[`hour_${hour}`];
            if (temperatureAtHour === null || temperatureAtHour === undefined) return;

            const anomaly = Math.round(data.temperature - temperatureAtHour);

            // Determine text color class based on anomaly value
            const textColorClass = (anomaly < -6 || anomaly > 6) ? 'light-text' : 'dark-text';

            // Get color based on temperature anomaly
            const markerColor = getAnomalyColor(anomaly);

            // Check if this is a remembered city
            const isRemembered = rememberedCityIds.some(id => id === city.id) && !isSelected;

            const cityGroup = d3.select(markersRef.current).append("g")
                .attr("class", `city${isSelected ? " selected" : ""}${isRemembered ? " remembered" : ""}`)
                .attr("transform", `translate(${coords[0]}, ${coords[1]})`)
                .style("cursor", "pointer")
                .attr("data-city-id", city.id);

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

                    tooltipRef.current.show(city.name, markerX, markerY);
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

    }, [cities, areCitiesCorrelated, stations, liveData, hourlyData, selectedCityId, rememberedCityIds, dispatch, handleCitySelect]);

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
