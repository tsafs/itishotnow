import { useEffect, useRef, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import * as Plot from "@observablehq/plot";
import ContentSplit from '../../layout/ContentSplit';
import { selectCity } from '../../../store/slices/selectedCitySlice';
import { fetchGermanyGeoJSON } from '../../../services/GeoJSONService';
import { useCorrelatedData } from '../../../store/hooks/correlatedDataHook';
import StationDetails from '../../stationDetails/StationDetails';
import { useYearlyMeanByDayData } from '../../../store/slices/YearlyMeanByDaySlice';
import { PREDEFINED_CITIES } from '../../../constants/map';
import MapLegend from '../../d3map/MapLegend';
import './View.css';
import { useSelectedItem } from '../../../store/hooks/selectedItemHook';
import { useSelectedDate } from '../../../store/slices/selectedDateSlice';
import { DateTime } from 'luxon';
import { getNow } from '../../../utils/dateUtils';

const getDataForPlot = (correlatedData) => {
    return Object.values(correlatedData).map(({ city, station, data }) => ({
        cityId: city.id,
        cityName: city.name,
        cityLat: city.lat,
        cityLon: city.lon,
        stationId: station.id,
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
    const historicalData = useYearlyMeanByDayData();
    const selectedItem = useSelectedItem();
    const selectedDate = useSelectedDate();
    const rememberedCityIds = useSelector(state => state.rememberedCities);

    const [geojson, setGeojson] = useState(null);

    const staticPlotRef = useRef();
    const dynamicPlotRef = useRef();
    const lastSelectedCityId = useRef();

    const isToday = DateTime.fromISO(selectedDate).hasSame(getNow(), 'day');

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

    // Render static plot (base map, contours) only when geojson or correlatedData changes
    useEffect(() => {
        if (!correlatedData || !geojson || !historicalData) return;

        if (staticPlotRef.current) {
            staticPlotRef.current.innerHTML = '';
        }

        const data = getDataForPlot(correlatedData);

        // Calculate max temperature anomaly
        data.forEach(d => {
            const maxTemperature = historicalData[d.stationId].tasmax;
            if (d.temperature === undefined || maxTemperature === undefined) {
                d.anomaly = undefined; // Handle missing data gracefully
            } else {
                d.anomaly = d.temperature - maxTemperature;
            }
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
        historicalData,
    ]);

    // Render dynamic overlays (city dots, labels, selection) on every relevant state change
    const renderDynamicOverlay = useCallback(() => {
        if (!correlatedData || !geojson || !selectedItem) return;

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
    ]);

    useEffect(() => {
        renderDynamicOverlay();
    }, [renderDynamicOverlay]);

    // Left side content with tabs for different content types
    const rightContent = (
        <div className="plot-container-left-align">
            <div className="plot-container">
                <div className="plot-title">{isToday ? "Heutige Temperaturabweichung" : "Temperaturabweichung am " + DateTime.fromISO(selectedDate).setLocale('de').toFormat("d. MMMM yyyy")} zu&nbsp;1961&nbsp;bis&nbsp;1990&nbsp;(°C)</div>
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
