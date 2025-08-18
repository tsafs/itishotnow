import * as Plot from '@observablehq/plot';

export default function createPlot(daysBelow0Tmax, daysAbove30Tmax) {
    if (!daysBelow0Tmax || !daysAbove30Tmax) return null;

    // Transform data for plotting
    const below0 = [];
    const above30 = [];
    const labels = [];

    // Get years from any metric (they should all have the same years)
    const years = daysBelow0Tmax.x || [];
    if (years.length === 0) return null; // No data to plot

    // Transform data for plotting
    years.forEach((year, index) => {
        below0.push({
            year,
            days: -daysBelow0Tmax.y[index] || 0
        });

        above30.push({
            year,
            days: daysAbove30Tmax.y[index] || 0
        });

        if (
            index === 0 ||
            index === years.length - 1 ||
            year % 10 === 0) {
            labels.push({
                year,
                days: daysAbove30Tmax.y[index] || 0,
                label: String(year)
            });
        }
    });

    return Plot.plot({
        width: 1000,
        height: 300,
        nice: true,
        x: {
            label: null,
            tickRotate: -90,
            tickSize: 0,
            line: false,
            ticks: null,
            tickPadding: 100
        },
        y: {
            tickSize: 0,
            label: null,
            tickFormat: d => Math.abs(d),
        },
        color: {
            type: "diverging",
            scheme: "BuRd",
            symmetric: false,
        },
        marks: [
            // Bars for each threshold
            Plot.rectY(below0, {
                x: "year",
                y: "days",
                fill: "days",
                ry2: 5,
            }),

            // Bars for each threshold
            Plot.rectY(above30, {
                x: "year",
                y: "days",
                fill: "days",
                ry2: 5,
            }),

            // Horizontal intersecting grid lines in white
            Plot.gridY({ stroke: "#D7DDE2", strokeOpacity: 1 }),

            // Vertical years for above 30°C
            Plot.text(labels, {
                text: "label",
                x: "year",
                y: i => i.days + 1,
                rotate: -90,
                textAnchor: "start",
                fontSize: 12,
            }),
        ]
    });
}