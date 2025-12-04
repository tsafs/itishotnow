export interface PlotRegistryEntry {
    id: string;
    loader: () => Promise<{ default: React.ComponentType<any> }>;
}

export const plots: PlotRegistryEntry[] = [
    {
        id: 'ice-and-hot-days',
        loader: () => import('./iceAndHotDays/View'),
    },
    {
        id: 'country-heatmap',
        loader: () => import('./HeatmapGermany/View'),
    },
    {
        id: 'historical-analysis',
        loader: () => import('./TemperatureAnomaliesByDayOverYears/View'),
    },
];
