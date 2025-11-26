export interface PlotRegistryEntry {
    id: string;
    loader: () => Promise<{ default: React.ComponentType<any> }>;
}

export const plots: PlotRegistryEntry[] = [
    {
        id: 'country-heatmap',
        loader: () => import('../analysis/CountryHeatmapPlot/View'),
    },
    {
        id: 'historical-analysis',
        loader: () => import('../analysis/HistoricalAnalysis'),
    },
];
