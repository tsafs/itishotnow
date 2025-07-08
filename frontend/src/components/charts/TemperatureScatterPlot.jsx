import { useEffect, useRef, useState } from 'react';
import * as Plot from "@observablehq/plot";
import { html } from 'htl';
import * as d3 from "d3";
import { useSelector } from 'react-redux';
import { fetchRollingAverageForStation } from '../../services/DataService';
import { getNow } from '../../utils/dateUtils';
import './TemperatureScatterPlot.css';

/**
 * Filter temperature data to include only dates within a window around a target date
 * @param {Array} data - The full dataset
 * @param {string} targetMonthDay - The target month-day in MM-DD format
 * @param {number} windowDays - Number of days to include before and after target date
 * @returns {Object} Filtered data separated by primary day and surrounding days
 */
const filterTemperatureDataByDateWindow = (data, targetMonthDay, windowDays = 7) => {
    // Calculate window dates
    const [targetMonth, targetDay] = targetMonthDay.split('-').map(Number);
    const windowDates = [];

    // Create a reference date for this year
    const currentYear = getNow().getFullYear();
    const targetDate = new Date(currentYear, targetMonth - 1, targetDay);

    // Add days before and after
    for (let i = -windowDays; i <= windowDays; i++) {
        const windowDate = new Date(targetDate);
        windowDate.setDate(targetDate.getDate() + i);
        const windowMonth = String(windowDate.getMonth() + 1).padStart(2, '0');
        const windowDay = String(windowDate.getDate()).padStart(2, '0');
        windowDates.push(`${windowMonth}-${windowDay}`);
    }

    // Primary day data (exactly matching target date)
    const primaryDayData = [];

    // Surrounding days data (within window but not on target date)
    const surroundingDaysData = [];

    // Process each data point
    data.forEach(entry => {
        const dateParts = entry.date.split('-');
        if (dateParts.length < 3) return;

        const entryMonthDay = `${dateParts[1]}-${dateParts[2]}`;

        if (entryMonthDay === targetMonthDay) {
            // This entry is for our primary target day
            primaryDayData.push({
                ...entry,
                isPrimaryDay: true
            });
        } else if (windowDates.includes(entryMonthDay)) {
            // This entry is within our window but not the target day
            surroundingDaysData.push({
                ...entry,
                isPrimaryDay: false
            });
        }
    });

    return { primaryDayData, surroundingDaysData };
};

const TemperatureScatterPlot = () => {
    const containerRef = useRef();
    const selectedCity = useSelector(state => state.selectedCity);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fromYear = 1951;
    const toYear = 2024;
    const baselineStartYear = 1961; // Define baseline start year
    const baselineEndYear = 1990;   // Define baseline end year

    // Fetch historical data for the station
    useEffect(() => {
        if (!selectedCity) return;

        const fetchHistoricalData = async () => {
            try {
                setLoading(true);
                // Fetch all data for the station and period
                const allData = await fetchRollingAverageForStation(selectedCity.station_id);

                if (allData && allData.length > 0) {
                    setData(allData);
                    setError(null);
                } else {
                    setError(`No data available`);
                }
            } catch (err) {
                console.error("Error fetching historical data:", err);
                setError(`Failed to load temperature data.`);
            } finally {
                setLoading(false);
            }
        };

        fetchHistoricalData();
    }, [selectedCity]);

    // Create the plot using Observable Plot
    useEffect(() => {
        if (!data.length || loading || error || !selectedCity) return;

        // Clear any existing plot
        if (containerRef.current) {
            containerRef.current.innerHTML = '';
        }

        // Parse the date to get day and month
        const today = getNow();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayMonthDay = `${month}-${day}`;

        try {
            // Filter data for our date window (±7 days)
            const { primaryDayData, surroundingDaysData } =
                filterTemperatureDataByDateWindow(data, todayMonthDay, 7);

            if (primaryDayData.length === 0) {
                setError(`No data found for ${todayMonthDay} in the selected time period`);
                return;
            }

            // Format data for the plot
            const formattedPrimaryData = primaryDayData.map(entry => {
                const year = parseInt(entry.date.split('-')[0]);
                return {
                    year,
                    temperature: entry.tas,
                    date: entry.date,
                    isPrimaryDay: true
                };
            });

            const formattedSurroundingData = surroundingDaysData.map(entry => {
                const year = parseInt(entry.date.split('-')[0]);
                return {
                    year,
                    temperature: entry.tas,
                    date: entry.date,
                    isPrimaryDay: false
                };
            });

            // Calculate average temperature only for the baseline period (1961-1990)
            const baselinePrimaryDayData = formattedPrimaryData.filter(
                d => d.year >= baselineStartYear && d.year <= baselineEndYear
            );

            const averageTempForPrimaryDay = d3.mean(baselinePrimaryDayData, d => d.temperature);

            // Calculate anomalies for primary day
            const primaryDayWithAnomalies = formattedPrimaryData.map(entry => ({
                ...entry,
                anomaly: entry.temperature - averageTempForPrimaryDay
            }));

            // Calculate anomalies for surrounding days (relative to primary day average)
            const surroundingDaysWithAnomalies = formattedSurroundingData.map(entry => ({
                ...entry,
                anomaly: entry.temperature - averageTempForPrimaryDay
            }));

            // Combine datasets
            const allDataWithAnomalies = [
                ...primaryDayWithAnomalies,
                ...surroundingDaysWithAnomalies
            ];

            // Add today's data point if available
            let todayDataPoint = null;
            if (selectedCity?.min_temperature && selectedCity?.max_temperature) {
                // Workaround until the true mean is calculated on the backend job:
                const averageTemperature = (selectedCity.min_temperature + selectedCity.max_temperature) / 2;
                const todayAnomaly = averageTemperature - averageTempForPrimaryDay;
                todayDataPoint = {
                    year: getNow().getFullYear(),
                    temperature: averageTemperature,
                    anomaly: todayAnomaly,
                    date: `${getNow().getFullYear()}-${month}-${day}`,
                    isPrimaryDay: true,
                    isCurrent: true
                };
            }

            // Sort by year for better visualization
            allDataWithAnomalies.sort((a, b) => a.year - b.year);

            // Calculate trend per decade
            const primaryDayData2 = allDataWithAnomalies.filter(d => d.isPrimaryDay);
            const years = primaryDayData2.map(d => d.year);
            const anomalies = primaryDayData2.map(d => d.anomaly);

            // Simple linear regression calculation
            const n = years.length;
            const sumX = d3.sum(years);
            const sumY = d3.sum(anomalies);
            const sumXY = d3.sum(years.map((year, i) => year * anomalies[i]));
            const sumXX = d3.sum(years.map(year => year * year));

            const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
            const trendPerDecade = slope * 10; // Convert per year to per decade

            // Format trend with German number format (comma as decimal separator)
            const formattedTrend = trendPerDecade.toFixed(1).replace('.', ',');
            console.log("Trend per decade:", formattedTrend);

            const anomaliesForDetails = allDataWithAnomalies.filter(d => d.isPrimaryDay);
            anomaliesForDetails.push(todayDataPoint);

            // Create the plot
            const plot = Plot.plot({
                title: html`<p class="title">Abweichung zum Referenzzeitraum von 1961 bis 1990 in ${selectedCity?.station_name}</p>`,
                y: {
                    label: "Temperaturabweichung (°C)",
                    grid: true,
                    nice: true,
                    labelOffset: 55,
                    labelAnchor: "center",
                    tickSize: 5,
                    labelArrow: false,
                },
                x: {
                    label: null,
                    domain: [fromYear - 1, toYear + 1], // Extend domain to include the today point
                    tickFormat: d => Math.round(d).toString(), // Format years as integers without decimal points
                    tickSize: 5,
                    tickPadding: 5,
                },
                color: {
                    scheme: "BuYlRd",
                },
                marks: [
                    Plot.ruleY([0],
                        {
                            stroke: "#666",
                            strokeWidth: 1,
                        }
                    ), // Zero line
                    Plot.ruleX([1961, 1990],
                        {
                            stroke: "#666",
                            strokeWidth: 1,
                            strokeDasharray: "5,2"
                        }
                    ), // Baseline period line
                    // Background dots for surrounding days
                    Plot.dot(allDataWithAnomalies.filter(d => !d.isPrimaryDay), {
                        x: "year",
                        y: "anomaly",
                        stroke: "#ddd",
                        fill: "#ddd",
                        r: 2,
                    }),
                    // Trend line for primary day
                    Plot.linearRegressionY(allDataWithAnomalies.filter(d => d.isPrimaryDay), {
                        x: "year",
                        y: "anomaly",
                        stroke: "#333",       // Line color
                        strokeWidth: 1,       // Line thickness
                        strokeOpacity: 1,   // Line opacity
                        strokeDasharray: "5,2", // Optional: makes the line dashed
                    }),
                    // Primary dots for the target day
                    Plot.dot(allDataWithAnomalies.filter(d => d.isPrimaryDay), {
                        x: "year",
                        y: "anomaly",
                        stroke: "anomaly",
                        strokeWidth: 2,
                        fill: "anomaly",
                        fillOpacity: 0.2,
                        r: 4,
                    }),
                    // Today's data point as a separate element
                    todayDataPoint && Plot.dot([todayDataPoint], {
                        x: "year",
                        y: "anomaly",
                        stroke: "anomaly",
                        fill: "anomaly",
                        fillOpacity: 0.2,
                        strokeWidth: 2,
                        r: 6,
                    }),
                    // Custom label for today's data point
                    todayDataPoint && Plot.text([todayDataPoint], {
                        x: "year",
                        y: d => d.anomaly + 0.7, // Position slightly above the point
                        text: () => "Heute",
                        className: "today-label",
                    }),
                    // Display trend information
                    Plot.text([{ year: 1975, anomaly: 1.6 }], {
                        x: "year",
                        y: "anomaly",
                        text: () => `Trend: ${formattedTrend}°C / Jahrzehnt`,
                        fontSize: 12,
                        fontWeight: "bold",
                        fill: "#333",
                    }),
                    // Details top left corner
                    Plot.text(anomaliesForDetails, Plot.pointerX({
                        px: "year",
                        py: "anomaly",
                        dy: -17,
                        frameAnchor: "top",
                        text: (d) => [
                            new Date(d.date).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }),
                            `Durchschnittstemperatur: ${d.temperature.toFixed(1)}°C`,
                            `Abweichung: ${d.anomaly.toFixed(1)}°C`
                        ].join("   "),
                        className: "hover-text",
                    }))
                ]
            });

            containerRef.current.appendChild(plot);

            return () => plot.remove();
        } catch (err) {
            console.error("Error creating plot:", err);
            setError("Failed to create plot visualization");
        }
    }, [data, loading, error, selectedCity, fromYear, toYear]);

    return (
        <div className="temperature-scatter-container">
            {loading && <div className="loading-message">Loading data...</div>}
            {error && <div className="error-message">{error}</div>}
            <div ref={containerRef}></div>
        </div>
    );
};

export default TemperatureScatterPlot;
