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
    const currentYear: string = data.series.length > 0 ? data.series[data.series.length - 1]!.year + "" : 'N/A';
    const lastYear: string = data.series.length > 1 ? data.series[data.series.length - 2]!.year + "" : 'N/A';
    const referenceYears = data.series.length > 2
        ? `${data.series[0]!.year} - ${data.series[data.series.length - 3]!.year}`
        : 'N/A';
    const legendVerticalSpacing = isMobile ? 3 : 2;

    const lines: Plot.Line[] = data.series.map((series) => Plot.lineY(series.values, {
        x: (_d, i) => i,
        y: (d) => (typeof d === 'number' && Number.isFinite(d)) ? d : Number.NaN,
        stroke: series.stroke,
        strokeWidth: series.strokeWidth,
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
            // Inline legend
            Plot.ruleY([2], {
                x1: 0.05,
                x2: 0.35,
                stroke: CURRENT_YEAR_STROKE,
                strokeWidth: 2.5,
            }),
            Plot.text([{ x: 0.4, y: 2, text: currentYear }], {
                x: 'x', y: 'y', text: 'text', fill: CURRENT_YEAR_STROKE,
                fontSize, fontWeight: 'bold', textAnchor: 'start'
            }),

            Plot.ruleY([2 - legendVerticalSpacing], {
                x1: 0.05, x2: 0.35, stroke: blueScheme[9]!.color, strokeWidth: 2.5,
            }),
            Plot.text([{ x: 0.4, y: 2 - legendVerticalSpacing, text: lastYear }], {
                x: 'x', y: 'y', text: 'text', fill: blueScheme[9]!.color,
                fontSize, fontWeight: 'bold', textAnchor: 'start'
            }),

            Plot.ruleY([2 - legendVerticalSpacing * 2 + 0.35], {
                x1: 0.05, x2: 0.35, stroke: blueScheme[6]!.color, strokeWidth: 2.0,
            }),
            Plot.ruleY([2 - legendVerticalSpacing * 2], {
                x1: 0.05, x2: 0.35, stroke: blueScheme[4]!.color, strokeWidth: 2.0,
            }),
            Plot.ruleY([2 - legendVerticalSpacing * 2 - 0.35], {
                x1: 0.05, x2: 0.35, stroke: blueScheme[2]!.color, strokeWidth: 2.0,
            }),
            Plot.text([{ x: 0.4, y: 2 - legendVerticalSpacing * 2, text: referenceYears }], {
                x: 'x', y: 'y', text: 'text', fill: blueScheme[4]!.color,
                fontSize, fontWeight: 'bold', textAnchor: 'start'
            }),
        ]
    }) as unknown as HTMLElement;
}
