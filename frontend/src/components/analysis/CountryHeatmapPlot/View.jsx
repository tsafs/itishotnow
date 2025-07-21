import { useEffect, useRef, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import * as Plot from "@observablehq/plot";
import ContentSplit from '../../layout/ContentSplit';
import { selectCity } from '../../../store/slices/selectedCitySlice';
import { fetchGermanyGeoJSON } from '../../../services/GeoJSONService';
import { useCorrelatedData } from '../../../store/hooks/correlatedDataHook';
import StationDetails from '../../stationDetails/StationDetails';
import { useHistoricalData } from '../../../store/hooks/historicalDataHook';
import { PREDEFINED_CITIES } from '../../../constants/map';
import MapLegend from '../../d3map/MapLegend';
import './View.css';
import { useSelectedItem } from '../../../store/hooks/selectedItemHook';

const getDataForPlot = (correlatedData) => {
    return Object.values(correlatedData).map(({ city, station, data }) => ({
        cityId: city.id,
        cityName: city.name,
        cityLat: city.lat,
        cityLon: city.lon,
        stationLat: station.lat,
        stationLon: station.lon,
        temperature: data.maxTemperature,
    }));
};

// Helper to get fontSize and dy based on screen width
const getTextStyle = () => {
    const width = window.innerWidth;
    if (width <= 480) {
        return { fontSize: 16, dy: 10 };
    } else if (width <= 768) {
        return { fontSize: 14, dy: 9 };
    } else {
        return { fontSize: 12, dy: 8 };
    }
};

const HistoricalAnalysis = () => {
    const dispatch = useDispatch();
    const correlatedData = useCorrelatedData();
    const historicalData = useHistoricalData();
    const selectedItem = useSelectedItem();
    const rememberedCityIds = useSelector(state => state.rememberedCities);

    const [geojson, setGeojson] = useState(null);
    const [historicalMeanMaxTemperature, setHistoricalMeanMaxTemperature] = useState(null);

    const staticPlotRef = useRef();
    const dynamicPlotRef = useRef();
    const lastSelectedCityId = useRef();

    useEffect(() => {
        const loadGeoJSON = async () => {
            try {
                const topoJSON = await fetchGermanyGeoJSON();
                setGeojson(topoJSON);
            } catch (error) {
                console.error('Error loading TopoJSON:', error);
            }
        };

        loadGeoJSON();
    }, []);

    // Determine minimum, maximum, and average maxTemperature from historical data over all stations
    useEffect(() => {
        if (!historicalData || historicalData.length === 0) return;

        const maxTemperatures = Object.values(historicalData).map(data => data.tasmax);
        if (maxTemperatures.length === 0) return;

        setHistoricalMeanMaxTemperature(maxTemperatures.reduce((a, b) => a + b, 0) / maxTemperatures.length);
    }, [historicalData]);

    // Render static plot (base map, contours) only when geojson or correlatedData changes
    useEffect(() => {
        if (!correlatedData || !geojson) return;
        if (historicalMeanMaxTemperature === null) return;

        if (staticPlotRef.current) {
            staticPlotRef.current.innerHTML = '';
        }

        const data = getDataForPlot(correlatedData);

        // Calculate max temperature anomaly
        data.forEach(d => {
            d.anomaly = d.temperature - historicalMeanMaxTemperature;
        });

        const staticPlot = Plot.plot({
            projection: {
                type: "mercator",
                domain: geojson
            },
            color: {
                type: "diverging",
                scheme: "Turbo",
                domain: [-10, +10],
                pivot: 0
            },
            marks: [
                Plot.contour(
                    data,
                    {
                        x: "stationLon",
                        y: "stationLat",
                        fill: "anomaly",
                        blur: 1.5,
                        clip: geojson
                    }
                ),
                Plot.geo(geojson, { stroke: "black" }),
            ]
        });

        staticPlotRef.current.appendChild(staticPlot);
    }, [
        correlatedData,
        geojson,
        historicalMeanMaxTemperature,
    ]);

    // Render dynamic overlays (city dots, labels, selection) on every relevant state change
    const renderDynamicOverlay = useCallback(() => {
        if (!correlatedData || !geojson || !selectedItem) return;
        if (historicalMeanMaxTemperature === null) return;

        if (dynamicPlotRef.current) {
            dynamicPlotRef.current.innerHTML = '';
        }

        // Filter out all data points that do not belong to PREDEFINED_CITIES
        const data = getDataForPlot(correlatedData);
        const cityData = data.filter(d => {
            const isPredefined = PREDEFINED_CITIES.map(c => c.toLowerCase()).includes(d.cityName.toLowerCase())
            const isRemembered = rememberedCityIds.includes(d.cityId);
            const isSelected = d.cityId === selectedItem.id;
            return isPredefined || isRemembered || isSelected;
        });

        const { fontSize, dy } = getTextStyle();

        const dynamicPlot = Plot.plot({
            projection: {
                type: "mercator",
                domain: geojson
            },
            marks: [
                Plot.dot(cityData, {
                    x: "cityLon",
                    y: "cityLat",
                    r: 3,
                    fill: "currentColor",
                    stroke: "white",
                    strokeWidth: 1.5,
                }),
                Plot.dot(cityData,
                    Plot.pointer({ x: "cityLon", y: "cityLat", stroke: "white", strokeWidth: 3, r: 5 })
                ),
                Plot.text(cityData, {
                    x: "cityLon",
                    y: "cityLat",
                    text: (i) => i.cityName,
                    fill: "currentColor",
                    stroke: "white",
                    lineAnchor: "top",
                    dy,
                    fontSize,
                })
            ]
        });

        dynamicPlot.addEventListener("input", () => {
            // If no city is selected, do nothing
            if (!dynamicPlot.value) return;

            // Prevent unnecessary dispatches if the hovered or selected city hasn't changed
            if (dynamicPlot.value.cityId === lastSelectedCityId.current) return;
            lastSelectedCityId.current = dynamicPlot.value.cityId;

            const isPredefined = PREDEFINED_CITIES.includes(dynamicPlot.value.cityName);
            dispatch(selectCity(dynamicPlot.value.cityId, isPredefined));
        });

        dynamicPlotRef.current.appendChild(dynamicPlot);
    }, [
        correlatedData,
        geojson,
        selectedItem,
        rememberedCityIds,
        dispatch,
        historicalMeanMaxTemperature,
    ]);

    useEffect(() => {
        renderDynamicOverlay();
    }, [renderDynamicOverlay]);

    // Left side content with tabs for different content types
    const rightContent = (
        <div className="plot-container-left-align">
            <div className="plot-container">
                <div className="plot-title">Heutige Temperaturabweichung zu&nbsp;1961&nbsp;bis&nbsp;1990&nbsp;(°C)</div>
                <div className="plot">
                    <div ref={staticPlotRef}></div>
                    <div ref={dynamicPlotRef} className="dynamic-plot"></div>
                </div>
                <MapLegend title="Abweichung (°C)" colorScheme="Turbo" />
            </div>
        </div>
    );

    // Right side content with the scatter plot
    const leftContent = (
        <div className="info">
            <StationDetails />
        </div >
    );

    return (
        <div className="daily-anomaly-explorer">
            <ContentSplit
                leftContent={leftContent}
                rightContent={rightContent}
                leftRatio={45}
                rightRatio={55}
            />
        </div>
    );
};

export default HistoricalAnalysis;
