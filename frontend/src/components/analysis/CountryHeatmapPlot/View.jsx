import { useEffect, useRef, useState } from 'react';
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

const HistoricalAnalysis = () => {
    const dispatch = useDispatch();
    const correlatedData = useCorrelatedData();
    const historicalData = useHistoricalData();
    const selectedItem = useSelectedItem();

    const [geojson, setGeojson] = useState(null);
    const [historicalTemperatureMaximum, setHistoricalTemperatureMaximum] = useState(25.6);
    const [historicalTemperatureMinimum, setHistoricalTemperatureMinimum] = useState(20.15);
    const [historicalTemperatureMean, setHistoricalTemperatureMean] = useState(14.7);
    const containerRef = useRef();

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

    // Create the plot using Observable Plot
    useEffect(() => {
        if (!correlatedData || !geojson || !selectedItem) return;
        if (historicalTemperatureMaximum === undefined || historicalTemperatureMinimum === undefined || historicalTemperatureMean === undefined) return;

        // Clear any existing plot
        if (containerRef.current) {
            containerRef.current.innerHTML = '';
        }

        // Prepare data for the plot
        const data = Object.values(correlatedData).map(({ city, station, data }) => ({
            ...{
                cityId: city.id,
                cityName: city.name,
                cityLat: city.lat,
                cityLon: city.lon,
            },
            ...{
                stationLat: station.lat,
                stationLon: station.lon,
            },
            ...{
                temperature: data.maxTemperature,
            }
        }));

        // Filter out all data points that do not belong to PREDEFINED_CITIES
        const cityData = data.filter(d =>
            PREDEFINED_CITIES.map(c => c.toLowerCase()).includes(d.cityName.toLowerCase())
        );

        const plot = Plot.plot({
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
                Plot.dot(cityData, {
                    x: "cityLon",
                    y: "cityLat",
                    r: 3,
                    fill: "currentColor",
                    stroke: "white",
                    strokeWidth: 1.5,
                }),
                Plot.dot(cityData, 
                    Plot.pointer({x: "cityLon", y: "cityLat", stroke: "white", strokeWidth: 3, r: 5})
                ),
                Plot.text(cityData, {
                    x: "cityLon",
                    y: "cityLat",
                    text: (i) => i.cityName,
                    fill: "currentColor",
                    stroke: "white",
                    lineAnchor: "top",
                    dy: 7, // Adjust text position slightly below the dot
                    fontSize: 10,
                })
            ]
        });

        plot.addEventListener("input", () => {
            if (!plot.value) return;
            const isPredefined = PREDEFINED_CITIES.includes(plot.value.cityName);
            dispatch(selectCity(plot.value.cityId, isPredefined));
        });

        containerRef.current.appendChild(plot);
    }, [dispatch, selectedItem, correlatedData, geojson, historicalTemperatureMean, historicalTemperatureMinimum, historicalTemperatureMaximum]);

    // Left side content with tabs for different content types
    const rightContent = (
        <div className="plot">
            <div ref={containerRef}></div>
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
