import * as Plot from '@observablehq/plot';
import type { IPlotData } from './hooks/usePlotData';

const MONTH_LABELS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

export default function createPlot(
    data: IPlotData,
    plotDims: {
        width: number;
        height: number;
    },
): HTMLElement {
    // Create one line mark per series, mapping stroke to the label so Plot can infer colors and render a legend.
    const lines: Plot.Line[] = data.series.map((series) =>
        Plot.lineY(series.values, {
            x: 'x',
            y: (d) => (typeof d?.y === 'number' && Number.isFinite(d.y)) ? d.y : Number.NaN,
            stroke: 'label',
            strokeWidth: series.strokeWidth,
            strokeOpacity: series.strokeOpacity,
            curve: 'catmull-rom',
        })
    );

    const hasPalette = data.colorDomain.length > 0 && data.colorRange.length === data.colorDomain.length;

    return Plot.plot({
        width: plotDims.width,
        height: plotDims.height,
        // nice: true,
        insetLeft: 5,
        insetBottom: 5,
        color: {
            legend: true,
            type: 'ordinal',
            ...(hasPalette ? { domain: data.colorDomain, range: data.colorRange } : {}),
            // @ts-expect-error Observable Plot supports className on color legend; typings are outdated.
            className: 'legend'
        },
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
            label: "Temperatur in °C",
            labelAnchor: "center",
            labelArrow: false,
            line: true,
            domain: data.domain,
        },
        marks: [
            ...lines
        ]
    }) as unknown as HTMLElement;
}