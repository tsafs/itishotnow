import * as Plot from '@observablehq/plot';
import type { IXYData } from '../../../classes/XYData';
import theme from '../../../styles/design-system';
import { getPercentileColorWithPivot } from '../../../utils/TemperatureUtils';

const FROM_YEAR = 1961;
const TO_YEAR = 1990;

interface DayData {
    year: number;
    days: number;
}

interface LabelData extends DayData {
    label: string;
}

function percentile(arr: number[], p: number): number {
    const sorted = arr.slice().sort((a, b) => a - b);
    const idx = (sorted.length - 1) * p;
    const lower = Math.floor(idx);
    const upper = Math.ceil(idx);
    if (lower === upper) return sorted[lower]!;
    return sorted[lower]! * (upper - idx) + sorted[upper]! * (idx - lower);
}

export default function createPlot(
    daysBelow0Tmax: IXYData,
    daysAbove30Tmax: IXYData,
    plotDims: {
        width: number;
        height: number;
    },
    fontSize: number,
    isDarkMode = false,
): HTMLElement {
    const themeColors = isDarkMode ? theme.colors.plotDark : theme.colors.plotLight;

    // Transform data for plotting
    const below0: DayData[] = [];
    const above30: DayData[] = [];
    const labels: LabelData[] = [];

    // Get years from any metric (they should all have the same years)
    const years = daysBelow0Tmax.x || [];

    // Calculate 5th to 95th percentile range for color domain
    const filteredIndices = years
        .map((year, index) => ({ year, index }))
        .filter(({ year }) => year >= FROM_YEAR && year <= TO_YEAR)
        .map(({ index }) => index);
    const below0DaysFiltered = filteredIndices.map(i => -(daysBelow0Tmax.y[i] || 0));
    const above30DaysFiltered = filteredIndices.map(i => daysAbove30Tmax.y[i] || 0);
    const domainLow = percentile(below0DaysFiltered, 0.05);
    const domainHigh = percentile(above30DaysFiltered, 0.95);

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
        width: plotDims.width,
        height: plotDims.height,
        nice: true,
        x: {
            label: null,
            tickRotate: -90,
            tickSize: 0,
            line: false,
            tickPadding: 100,
            paddingInner: 0.3,
        },
        y: {
            axis: "both",
            tickSize: 0,
            label: "Gesamte Anzahl der Tage",
            labelAnchor: "center",
            labelArrow: false,
            tickFormat: d => Math.abs(d),
        },
        marks: [
            // Bars for each threshold
            Plot.rectY(below0, {
                x: "year",
                y: "days",
                fill: d => getPercentileColorWithPivot(d.days, [domainLow, domainHigh], 'BlueRed'),
                ry2: 5,
            }),

            // Bars for above 30°C
            Plot.rectY(above30, {
                x: "year",
                y: "days",
                fill: d => getPercentileColorWithPivot(d.days, [domainLow, domainHigh], 'BlueRed'),
                ry2: 5,
            }),

            // Horizontal intersecting grid lines in white
            Plot.gridY({ stroke: themeColors.grid, strokeOpacity: 1 }),

            // Vertical years for above 30°C
            Plot.text(labels, {
                text: "label",
                x: "year",
                y: i => i.days + 1,
                rotate: -90,
                textAnchor: "start",
                fontSize: fontSize,
                fill: themeColors.text,
            }),
        ]
    }) as unknown as HTMLElement;
}