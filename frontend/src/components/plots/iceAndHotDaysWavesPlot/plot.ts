import * as Plot from '@observablehq/plot';
import theme from '../../../styles/design-system';
import { getPercentileColor } from '../../../utils/TemperatureUtils';
import type { IPlotData } from './hooks/usePlotData';


export default function createPlot(
    data: IPlotData,
    plotDims: {
        width: number;
        height: number;
    },
    fontSize: number,
    isDarkMode = false,
): HTMLElement {
    const themeColors = isDarkMode ? theme.colors.plotDark : theme.colors.plotLight;

    // Get sorted years to map oldest to newest
    const years = Object.keys(data.data).sort();
    const yearCount = years.length;

    // Construct lines for each year, plotting tasmax values
    let lines: Plot.Line[] = [];
    for (let yearIndex = 0; yearIndex < yearCount; yearIndex++) {
        const year = years[yearIndex]!;
        const yearData = data.data[parseInt(year, 10)];

        // Map year index to color: 0 = dark blue, yearCount-1 = light blue
        // Domain: [0, yearCount-1] maps to color scheme range [-10, 10]
        const colorValue = -10 + (yearIndex / (yearCount - 1)) * 20;
        const stroke = getPercentileColor(colorValue, [-10, 10], 'Blue');

        // Opacity increases with year: older years more transparent, recent years more opaque
        const opacity = 0.2 + (yearIndex / (yearCount - 1)) * 0.8;

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