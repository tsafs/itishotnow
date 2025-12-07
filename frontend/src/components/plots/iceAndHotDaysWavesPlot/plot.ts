import * as Plot from '@observablehq/plot';
import type { IPlotData } from './hooks/usePlotData';

const MONTH_LABELS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

export default function createPlot(
    data: IPlotData,
    plotDims: {
        width: number;
        height: number;
    },
    fontSize: number,
    _isDarkMode = false,
): HTMLElement {

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
        nice: true,
        insetLeft: 2,
        x: {
            axis: "bottom",
            labelAnchor: "center",
            ticks: 12,
            tickFormat: (d) => MONTH_LABELS[d] || '',
            tickSize: 0,
            line: true
        },
        y: {
            axis: "left",
            label: "Temperatur in °C",
            labelAnchor: "center",
            labelArrow: false,
            line: true,
            domain: data.domain,
        },
        marks: [
            ...lines,
        ]
    }) as unknown as HTMLElement;
}