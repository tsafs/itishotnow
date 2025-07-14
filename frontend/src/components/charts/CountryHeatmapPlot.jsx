import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import * as Plot from "@observablehq/plot";
import { fetchGeoJSON } from '../../services/DataService';
import './CountryHeatmapPlot.css';

const CountryHeatmapPlot = () => {
    const containerRef = useRef();
    const cities = useSelector(state => state.cities);
    const [geojson, setGeojson] = useState(null);
    const [historicalTemperatureMaximum, setHistoricalTemperatureMaximum] = useState(25.6);
    const [historicalTemperatureMinimum, setHistoricalTemperatureMinimum] = useState(20.15);
    const [historicalTemperatureMean, setHistoricalTemperatureMean] = useState(14.7);

    useEffect(() => {
        const loadGeoJSON = async () => {
            try {
                const topoJSON = await fetchGeoJSON('germany_10m_admin_0_reduced.json');
                setGeojson(topoJSON);
                console.log('TopoJSON loaded:', topoJSON);
            } catch (error) {
                console.error('Error loading TopoJSON:', error);
            }
        };

        loadGeoJSON();
    }, []);

    // Create the plot using Observable Plot
    useEffect(() => {
        if (!cities || !geojson) return;
        if (historicalTemperatureMaximum === undefined || historicalTemperatureMinimum === undefined || historicalTemperatureMean === undefined) return;

        // Clear any existing plot
        if (containerRef.current) {
            containerRef.current.innerHTML = '';
        }

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
                    cities,
                    {
                        x: "lon",
                        y: "lat",
                        fill: "temperature",
                        blur: 0,
                        clip: geojson
                    }
                ),
                Plot.geo(geojson, { stroke: "black" }),
            ]
        });

        containerRef.current.appendChild(plot);
    }, [cities, geojson, historicalTemperatureMean, historicalTemperatureMinimum, historicalTemperatureMaximum]);

    return (
        <div className="plot-container">
            <div ref={containerRef}></div>
        </div>
    );
};

export default CountryHeatmapPlot;
