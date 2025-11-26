export interface PlotRegistryEntry {
    id: string;
    loader: () => Promise<{ default: React.ComponentType<any> }>;
    darkMode?: boolean;
}

export const plots: PlotRegistryEntry[] = [
    {
        id: 'country-heatmap',
        loader: () => import('./HeatmapGermany/View'),
        darkMode: true,
    },
    {
        id: 'historical-analysis',
        loader: () => import('./TemperatureAnomaliesByDayOverYears/View'),
        darkMode: false,
    },
];
