import { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import * as Plot from "@observablehq/plot";
import ContentSplit from '../../layout/ContentSplit';
import { selectCity } from '../../../store/slices/selectedCitySlice';
import { fetchGermanyGeoJSON } from '../../../services/GeoJSONService';
import { useCorrelatedData } from '../../../store/hooks/correlatedDataHook';
import StationDetails from '../../stationDetails/StationDetails';
import { useHistoricalData } from '../../../store/hooks/historicalDataHook';
import { PREDEFINED_CITIES } from '../../../constants/map';
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

const HistoricalAnalysis = () => {
    const dispatch = useDispatch();
    const correlatedData = useCorrelatedData();
    const historicalData = useHistoricalData();
    const selectedItem = useSelectedItem();

    const [geojson, setGeojson] = useState(null);
    const [historicalTemperatureMaximum, setHistoricalTemperatureMaximum] = useState(25.6);
    const [historicalTemperatureMinimum, setHistoricalTemperatureMinimum] = useState(20.15);
    const [historicalTemperatureMean, setHistoricalTemperatureMean] = useState(14.7);
    const staticPlotRef = useRef();
    const dynamicPlotRef = useRef();

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

        const minTemperatures = Object.values(historicalData).map(data => data.tasmin);
        if (minTemperatures.length === 0) return;

        const meanTemperatures = Object.values(historicalData).map(data => data.tas);
        if (meanTemperatures.length === 0) return;

        setHistoricalTemperatureMaximum(Math.max(...maxTemperatures));
        setHistoricalTemperatureMinimum(Math.min(...minTemperatures));
        setHistoricalTemperatureMean(meanTemperatures.reduce((a, b) => a + b, 0) / meanTemperatures.length);
    }, [historicalData]);

    // Render static plot (base map, contours) only when geojson or correlatedData changes
    useEffect(() => {
        if (!correlatedData || !geojson) return;
        if (
            historicalTemperatureMaximum === undefined ||
            historicalTemperatureMinimum === undefined ||
            historicalTemperatureMean === undefined
        ) return;

        if (staticPlotRef.current) {
            staticPlotRef.current.innerHTML = '';
        }

        const data = getDataForPlot(correlatedData);

        const staticPlot = Plot.plot({
            projection: {
                type: "mercator",
                domain: geojson
            },
            color: {
                type: "diverging",
                scheme: "BuYlRd",
                domain: [historicalTemperatureMinimum, historicalTemperatureMaximum],
                pivot: historicalTemperatureMean
            },
            marks: [
                Plot.contour(
                    data,
                    {
                        x: "stationLon",
                        y: "stationLat",
                        fill: "temperature",
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
        historicalTemperatureMean,
        historicalTemperatureMinimum,
        historicalTemperatureMaximum
    ]);

    // Render dynamic overlays (city dots, labels, selection) on every relevant state change
    const renderDynamicOverlay = useCallback(() => {
        if (!correlatedData || !geojson || !selectedItem) return;
        if (
            historicalTemperatureMaximum === undefined ||
            historicalTemperatureMinimum === undefined ||
            historicalTemperatureMean === undefined
        ) return;

        if (dynamicPlotRef.current) {
            dynamicPlotRef.current.innerHTML = '';
        }

        const data = getDataForPlot(correlatedData);

        // Filter out all data points that do not belong to PREDEFINED_CITIES
        const cityData = data.filter(d =>
            PREDEFINED_CITIES.map(c => c.toLowerCase()).includes(d.cityName.toLowerCase())
        );

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
                    dy: 7,
                    fontSize: 10,
                })
            ]
        });

        dynamicPlot.addEventListener("input", () => {
            if (!dynamicPlot.value) return;
            const isPredefined = PREDEFINED_CITIES.includes(dynamicPlot.value.cityName);
            dispatch(selectCity(dynamicPlot.value.cityId, isPredefined));
        });

        dynamicPlotRef.current.appendChild(dynamicPlot);
    }, [
        correlatedData,
        geojson,
        selectedItem,
        dispatch,
        historicalTemperatureMean,
        historicalTemperatureMinimum,
        historicalTemperatureMaximum
    ]);

    useEffect(() => {
        renderDynamicOverlay();
    }, [renderDynamicOverlay]);

    // Left side content with tabs for different content types
    const rightContent = (
        <div className="plot">
            <div ref={staticPlotRef}></div>
            <div ref={dynamicPlotRef} className="dynamic-plot"></div>
        </div>
    );

    // Right side content with the scatter plot
    const leftContent = (
        <div className="info">
            <StationDetails />
        </div >
    );

    return (
        <div className="historical-analysis">
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
