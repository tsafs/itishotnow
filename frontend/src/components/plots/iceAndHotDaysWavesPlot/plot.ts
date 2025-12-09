import * as Plot from '@observablehq/plot';
import type { IPlotData } from './hooks/usePlotData';
import { blueScheme } from '../../../utils/TemperatureUtils';

const MONTH_LABELS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

export default function createPlot(
    data: IPlotData,
    plotDims: {
        width: number;
        height: number;
    },
): HTMLElement {
    const allSeries = [
        ...data.referenceYears,
        data.mean,
        data.lastYear,
        data.currentYear
    ]

    const lines: Plot.Line[] = allSeries.map((series) => {
        if (series) {
            return Plot.lineY(series.values, {
                x: (_d, i) => i,
                y: (d) => (typeof d === 'number' && Number.isFinite(d)) ? d : Number.NaN,
                stroke: series.stroke,
                strokeWidth: series.strokeWidth,
                strokeOpacity: series.strokeOpacity,
                curve: 'catmull-rom',
            })
        }
        return null;
    })
        .filter((line): line is Plot.Line => line !== null);

    return Plot.plot({
        width: plotDims.width,
        height: plotDims.height,
        // nice: true,
        insetLeft: 5,
        insetBottom: 5,
        color: {
            legend: true,
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