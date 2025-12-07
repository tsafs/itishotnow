import * as Plot from '@observablehq/plot';
import theme from '../../../styles/design-system';
import { getPercentileColor } from '../../../utils/TemperatureUtils';
import type { IPlotData } from './hooks/usePlotData';


export interface PlotConfig {
    referenceStart?: number;
    referenceEnd?: number;
    additionalYears?: number[];
    recentYearsCount?: number;
}

export default function createPlot(
    data: IPlotData,
    plotDims: {
        width: number;
        height: number;
    },
    fontSize: number,
    isDarkMode = false,
    config: PlotConfig = {},
): HTMLElement {
    const themeColors = isDarkMode ? theme.colors.plotDark : theme.colors.plotLight;

    // Default configuration
    const referenceStart = config.referenceStart ?? 1961;
    const referenceEnd = config.referenceEnd ?? 1990;
    const recentYearsCount = config.recentYearsCount ?? 1;

    // Get all available years and sort them
    const allYears = Object.keys(data.data)
        .map(y => parseInt(y, 10))
        .sort((a, b) => a - b);

    // Determine years to display
    let yearsToShow = allYears.filter(y => y >= referenceStart && y <= referenceEnd);

    if (config.additionalYears && config.additionalYears.length > 0) {
        // Add explicitly specified additional years
        yearsToShow = [...yearsToShow, ...config.additionalYears];
    } else {
        // Add most recent N years (not already in reference period)
        const recentYears = allYears
            .filter(y => y > referenceEnd)
            .slice(-recentYearsCount);
        yearsToShow = [...yearsToShow, ...recentYears];
    }

    // Remove duplicates and sort
    yearsToShow = Array.from(new Set(yearsToShow)).sort((a, b) => a - b);

    // Construct lines for each year, plotting tasmax values
    let lines: Plot.Line[] = [];
    for (let yearIndex = 0; yearIndex < yearsToShow.length; yearIndex++) {
        const year = yearsToShow[yearIndex]!;
        const yearData = data.data[year];

        if (!yearData) {
            continue;
        }

        // Map year position within ALL years to color: 0 = dark blue, length-1 = light blue
        // Domain: [0, allYears.length-1] maps to color scheme range [-10, 10]
        const yearPosition = allYears.indexOf(year);
        const colorValue = -10 + (yearPosition / (allYears.length - 1)) * 20;
        const stroke = getPercentileColor(colorValue, [-10, 10], 'Blue');

        // Opacity increases with year: older years more transparent, recent years more opaque
        const opacity = 0.2 + (yearIndex / (yearsToShow.length - 1)) * 0.8;

        const line = Plot.lineY(yearData, {
            x: (d, i) => i,
            y: (d) => d,
            stroke: stroke,
            strokeWidth: 2,
            opacity: opacity,
        });
        lines.push(line);
    }

    return Plot.plot({
        width: plotDims.width,
        height: plotDims.height,
        nice: true,
        axis: null,
        x: {
            axis: "bottom",
            label: "Tage →",
            // range: [0, 364],
            // ticks: 12,
            // tickFormat: (d) => {
            //     const month = Math.floor(d / 30) + 1;
            //     return month.toString();
            // }
        },
        y: {
            domain: data.domain,
        },
        marks: [
            ...lines,
        ]
    }) as unknown as HTMLElement;
}