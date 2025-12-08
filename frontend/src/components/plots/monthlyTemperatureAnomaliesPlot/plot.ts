import * as Plot from '@observablehq/plot';
import type { IPlotData } from './hooks/usePlotData';
import { blueScheme } from '../../../utils/TemperatureUtils';
import { CURRENT_YEAR_STROKE } from './hooks/usePlotData';

const MONTH_LABELS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

export default function createPlot(
    data: IPlotData,
    plotDims: { width: number; height: number },
    fontSize: number,
    isMobile = false,
): HTMLElement {
    // Determine special series: mean (white) and current year (red)
    const meanSeries = data.series.find((s) => s.stroke.toLowerCase() === '#ffffff');
    const currentSeries = data.series.find((s) => s.stroke.toLowerCase() === CURRENT_YEAR_STROKE.toLowerCase());
    const currentYear: string = currentSeries && Number.isFinite(currentSeries.year) ? String(currentSeries.year) : 'Aktuelles Jahr';
    const legendVerticalSpacing = isMobile ? 3 : 2;

    const lines: Plot.Line[] = data.series.map((series) => Plot.lineY(series.values, {
        x: (_d, i) => i,
        y: (d) => (typeof d === 'number' && Number.isFinite(d)) ? d : Number.NaN,
        stroke: series.stroke,
        strokeWidth: series.strokeWidth,
        strokeOpacity: series.strokeOpacity ?? 1,
        curve: 'catmull-rom',
    }));

    return Plot.plot({
        width: plotDims.width,
        height: plotDims.height,
        insetLeft: 5,
        insetBottom: 5,
        x: {
            axis: "bottom",
            labelAnchor: "center",
            ticks: 12,
            tickFormat: (d) => MONTH_LABELS[d] || '',
            tickSize: 0,
            label: null,
            labelArrow: false,
            line: true,
        },
        y: {
            axis: "left",
            label: "Anomalie in °C",
            labelAnchor: "center",
            labelArrow: false,
            line: true,
        },
        marks: [
            ...lines,
            // Inline legend: current year (red) and mean curve (white)
            Plot.ruleY([2], {
                x1: 0.05,
                x2: 0.35,
                stroke: CURRENT_YEAR_STROKE,
                strokeWidth: 3,
            }),
            Plot.text([{ x: 0.4, y: 2, text: currentYear }], {
                x: 'x', y: 'y', text: 'text', fill: CURRENT_YEAR_STROKE,
                fontSize, fontWeight: 'bold', textAnchor: 'start'
            }),

            Plot.ruleY([2 - legendVerticalSpacing], {
                x1: 0.05, x2: 0.35, stroke: '#ffffff', strokeWidth: 3,
            }),
            Plot.text([{ x: 0.4, y: 2 - legendVerticalSpacing, text: 'Mittelwert' }], {
                x: 'x', y: 'y', text: 'text', fill: '#ffffff',
                fontSize, fontWeight: 'bold', textAnchor: 'start'
            }),
        ]
    }) as unknown as HTMLElement;
}
