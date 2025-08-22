import { useEffect, useRef, useState } from 'react';
import * as Plot from "@observablehq/plot";
import * as d3 from "d3";
import { fetchHyrasMappedWeatherStations, fetchRollingAverageForStation } from '../../services/DataService.js';
import { getNow } from '../../utils/DateUtils';
import { DateTime } from 'luxon';
import { filterTemperatureDataByDateWindow } from '../../utils/rollingAverageUtils.js';
import './TemperaturePercentogram.css';
import { useAppSelector } from '../../store/hooks/useAppSelector.js';


/**
 * Calculate percentiles for the given data array
 * @param {Array} numbers - Array of temperature values
 * @returns {Array} Array of percentile thresholds
 */
function percentiles(numbers) {
    const sorted = d3.sort(numbers);
    return d3.range(0, 101).map((q) => d3.quantileSorted(sorted, q / 100));
}

const TemperaturePercentogram = ({ fromYear = 1961, toYear = 1990 }) => {
    const containerRef = useRef();
    const selectedCity = useAppSelector(state => state.selectedCity);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stationOutputId, setStationOutputId] = useState(null);

    // Find the corresponding HYRAS station for the selected city
    useEffect(() => {
        if (!selectedCity) return;

        const getStationOutputId = async () => {
            try {
                setLoading(true);
                setError(null);

                const hyrasStations = await fetchHyrasMappedWeatherStations();

                // Find the station that matches or is closest to the selected city
                const matchingStation = hyrasStations.find(
                    station => station.station_id === selectedCity.station_id
                );

                if (matchingStation) {
                    setStationOutputId(matchingStation.output_id);
                } else {
                    setError("No corresponding HYRAS station found for this location");
                }
            } catch (err) {
                console.error("Error fetching HYRAS stations:", err);
                setError("Failed to load station data");
            }
        };

        getStationOutputId();
    }, [selectedCity]);

    // Fetch historical data for the station
    useEffect(() => {
        if (!stationOutputId) return;

        const fetchHistoricalData = async () => {
            try {
                setLoading(true);
                // Fetch all data for the station and period
                const allData = await fetchRollingAverageForStation(fromYear, toYear, stationOutputId);

                if (allData && allData.length > 0) {
                    setData(allData);
                    setError(null);
                } else {
                    setError(`No data available for this time period (${fromYear}-${toYear})`);
                }
            } catch (err) {
                console.error("Error fetching historical data:", err);
                setError(`Failed to load temperature data for ${fromYear}-${toYear}`);
            } finally {
                setLoading(false);
            }
        };

        fetchHistoricalData();
    }, [stationOutputId, fromYear, toYear]);

    // Create the percentogram visualization
    useEffect(() => {
        if (!data.length || loading || error || !selectedCity) return;

        // Clear any existing content
        if (containerRef.current) {
            containerRef.current.innerHTML = '';
        }

        // Parse the date to get day and month
        const today = getNow();
        const month = String(today.month).padStart(2, '0');
        const day = String(today.day).padStart(2, '0');
        const todayMonthDay = `${month}-${day}`;

        try {
            // Filter data for our date window (±7 days)
            const filteredData = filterTemperatureDataByDateWindow(data, todayMonthDay, 7);

            if (filteredData.length === 0) {
                setError(`No data found for ${todayMonthDay} in the selected time period`);
                return;
            }

            // Format data for the plot
            const formattedData = filteredData.map(entry => {
                const year = parseInt(entry.date.split('-')[0]);
                return {
                    year,
                    temperature: entry.tas,
                    minTemp: entry.tasmin,
                    maxTemp: entry.tasmax,
                    humidity: entry.hurs,
                    date: entry.date
                };
            });

            // Extract all temperatures for the percentogram
            const allTemperatures = formattedData.map(d => d.temperature);

            // Calculate today's temperature if available
            let currentTemp = null;
            if (selectedCity?.min_temperature && selectedCity?.max_temperature) {
                // Calculate mean temperature
                currentTemp = (selectedCity.min_temperature + selectedCity.max_temperature) / 2;
            }

            // Calculate percentiles for binning
            const tempPercentiles = percentiles(allTemperatures);

            // Format date for display
            const formattedDate = DateTime.fromObject({ year: today.year, month, day }).toLocaleString({
                day: 'numeric',
                month: 'long'
            });

            // Create the percentogram
            const percentogram = Plot.plot({
                title: `Temperaturverteilung ${fromYear}-${toYear} am ${formattedDate} in ${selectedCity.station_name}`,
                width: 700,
                height: 400,
                marginBottom: 50,
                marginLeft: 60,
                color: {
                    legend: true,
                    type: "quantize",
                    scheme: "spectral",
                    n: 10,
                    label: "Perzentil",
                    tickFormat: d => `${d}%`
                },
                x: {
                    label: "Temperatur (°C)",
                    grid: true,
                },
                y: {
                    label: "Dichte",
                    grid: true
                },
                marks: [
                    // Percentogram bars
                    Plot.rectY(allTemperatures, {
                        fill: (d, i) => i / allTemperatures.length * 100,
                        ...Plot.binX({
                            y: (bin, { x1, x2 }) => 1 / (x2 - x1),
                            thresholds: tempPercentiles
                        })
                    }),
                    // Today's temperature vertical line
                    currentTemp && Plot.ruleX([currentTemp], {
                        stroke: "red",
                        strokeWidth: 3
                    }),
                    // Label for today's temperature
                    currentTemp && Plot.text([currentTemp], {
                        x: d => d,
                        y: d => 0,
                        dy: -15,
                        text: d => `Heute: ${d.toFixed(1)}°C`,
                        fill: "red",
                        fontWeight: "bold",
                        fontSize: 14
                    }),
                    // Base line
                    Plot.ruleY([0])
                ]
            });

            containerRef.current.appendChild(percentogram);

            return () => {
                if (percentogram) percentogram.remove();
            };
        } catch (err) {
            console.error("Error creating percentogram:", err);
            setError("Failed to create temperature distribution visualization");
        }
    }, [data, loading, error, selectedCity, fromYear, toYear]);

    return (
        <div className="temperature-percentogram-container">
            {loading && <div className="loading-message">Loading data...</div>}
            {error && <div className="error-message">{error}</div>}
            <div className="percentogram" ref={containerRef}></div>
        </div>
    );
};

export default TemperaturePercentogram;
