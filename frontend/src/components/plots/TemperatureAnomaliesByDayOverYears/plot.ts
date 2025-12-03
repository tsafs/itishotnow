
import type { PlotEntry } from "./hooks/useTemperatureAnomalyPlotData";
import * as Plot from "@observablehq/plot";
import type { Markish } from "@observablehq/plot";
import { html } from 'htl';
import { DateTime } from 'luxon';

export function createPlot(
    baselineStartYear: number,
    baselineEndYear: number,
    plotData: PlotEntry[],
    todayDataPoint: PlotEntry | null,
    isToday: boolean,
    targetDate: DateTime<boolean>,
    formattedTrend: string | null,
    anomaliesForDetails: PlotEntry[],
    selectedCityName: string,
    fromYear: number,
    toYear: number,
    plotDims: {
        width: number;
        height: number;
    }): HTMLElement {
    const primaryDayOnly = plotData.filter((d) => d.isPrimaryDay);

    const marks: Plot.Markish[] = [
        Plot.ruleY([0], {
            stroke: "#666",
            strokeWidth: 1,
        }),
        Plot.ruleX([baselineStartYear, baselineEndYear], {
            stroke: "#666",
            strokeWidth: 1,
            strokeDasharray: "5,2",
        }),
        Plot.dot(
            plotData.filter((d) => !d.isPrimaryDay),
            {
                x: "year",
                y: "anomaly",
                stroke: "#ddd",
                fill: "#ddd",
                r: 2,
            }
        ),
        Plot.linearRegressionY(primaryDayOnly, {
            x: "year",
            y: "anomaly",
            stroke: "#333",
            strokeWidth: 1,
            strokeOpacity: 1,
            strokeDasharray: "5,2",
        }),
        Plot.dot(primaryDayOnly, {
            x: "year",
            y: "anomaly",
            stroke: "anomaly",
            strokeWidth: 2,
            fill: "anomaly",
            fillOpacity: 0.2,
            r: 4,
        })
    ];

    if (todayDataPoint) {
        marks.push(
            Plot.dot([todayDataPoint], {
                x: "year",
                y: "anomaly",
                stroke: "anomaly",
                fill: "anomaly",
                fillOpacity: 0.2,
                strokeWidth: 2,
                r: 6,
            })
        );

        marks.push(
            Plot.text([todayDataPoint], {
                x: "year",
                y: (d) => d.anomaly + 0.7,
                text: () => (isToday ? "Heute" : targetDate.setLocale('de').toFormat("d. MMMM yyyy")),
                className: "today-label",
            })
        );
    }

    if (formattedTrend) {
        marks.push(
            Plot.text([{ year: 1975, anomaly: 1.6 }], {
                x: "year",
                y: "anomaly",
                text: () => `Trend: ${formattedTrend}°C / Jahrzehnt`,
                fontSize: 12,
                fontWeight: "bold",
                fill: "#333",
            })
        );
    }

    marks.push(
        Plot.text(
            anomaliesForDetails,
            Plot.pointerX({
                px: "year",
                py: "anomaly",
                dy: -17,
                frameAnchor: "top",
                text: (d) => [
                    DateTime.fromISO(d.date).setLocale('de').toFormat("d. MMMM yyyy"),
                    `Durchschnittstemperatur: ${d.temperature.toFixed(1)}°C`,
                    `Abweichung: ${d.anomaly.toFixed(1)}°C`,
                ].join("   "),
                className: "hover-text",
            })
        )
    );

    const plot = Plot.plot({
        title: html`<p class="title">Abweichung zu 1961 bis 1990 in ${selectedCityName}</p>`,
        y: {
            label: "Temperaturabweichung (°C)",
            grid: true,
            nice: true,
            labelAnchor: "center",
            tickSize: 0,
            tickPadding: 5,
            labelArrow: false,
        },
        x: {
            label: null,
            domain: [fromYear - 1, toYear + 1],
            tickFormat: (d) => Math.round(d).toString(),
            tickSize: 5,
            tickPadding: 5,
        },
        color: {
            scheme: "BuYlRd",
        },
        marks,
        width: plotDims.width,
        height: plotDims.height,
    });

    return plot as unknown as HTMLElement;
}

