import * as Plot from '@observablehq/plot';
import { MONTH_LABELS } from '../utils/plotStyles';
import type { IMonthsInYearsPlotData } from '../utils/yearSeries';
import theme from '../../../styles/design-system';

export default function createPlot(
    data: IMonthsInYearsPlotData,
    plotDims: { width: number; height: number },
    darkMode: boolean,
): HTMLElement {
    const plotTheme = darkMode ? theme.colors.plotDark : theme.colors.plotLight;

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
            label: "Anomalie in °C",
            labelAnchor: "center",
            labelArrow: false,
            line: true,
            domain: data.domain,
        },
        marks: [
            ...lines,
            Plot.ruleY([0], { stroke: plotTheme.foreground, strokeDasharray: '4 4' }),
        ]
    }) as unknown as HTMLElement;
}
