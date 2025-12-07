import * as Plot from '@observablehq/plot';
import type { IPlotData } from './hooks/usePlotData';

const MONTH_LABELS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

export default function createPlot(
    data: IPlotData,
    plotDims: {
        width: number;
        height: number;
    },
    _fontSize: number,
    _isDarkMode = false,
): HTMLElement {

    const lines: Plot.Line[] = data.series.map((series) => Plot.lineY(series.values, {
        x: (_d, i) => i,
        y: (d) => d,
        stroke: series.stroke,
        strokeWidth: 2,
        curve: 'catmull-rom',
    }));

    return Plot.plot({
        width: plotDims.width,
        height: plotDims.height,
        nice: true,
        // axis: null,
        x: {
            axis: "bottom",
            label: "Monat →",
            ticks: 12,
            tickFormat: (d) => MONTH_LABELS[d] || '',
        },
        y: {
            domain: data.domain,
        },
        marks: [
            ...lines,
        ]
    }) as unknown as HTMLElement;
}