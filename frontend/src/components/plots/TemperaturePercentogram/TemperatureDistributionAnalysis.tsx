// import { useState } from 'react';
// import PlotView from '../common/PlotView/PlotView.js';
// import PlotDescription from '../common/PlotDescription/PlotDescription.js';
// import type { Tab } from '../common/PlotDescription/PlotDescription.js';
// import { theme, createStyles } from '../../styles/design-system.js';
// import { useSelectedStationName } from '../../store/hooks/hooks.js';

// const styles = createStyles({
//     container: {
//         margin: `${theme.spacing.lg}px 0`,
//         padding: theme.spacing.md,
//         backgroundColor: theme.colors.backgroundLight,
//     },
//     timeRangeSelector: {
//         marginTop: theme.spacing.lg,
//         borderTop: `1px solid ${theme.colors.borderLight}`,
//         paddingTop: theme.spacing.md,
//     },
//     timeRangeSelectorTitle: {
//         marginTop: 0,
//         fontSize: theme.typography.fontSize.md,
//         color: theme.colors.textLight,
//         fontWeight: theme.typography.fontWeight.medium,
//     },
//     timeRangeButtons: {
//         display: 'flex',
//         gap: theme.spacing.sm,
//         marginTop: theme.spacing.sm,
//     },
//     timeRangeButton: {
//         padding: `${theme.spacing.xs}px ${theme.spacing.md}px`,
//         border: `1px solid ${theme.colors.border}`,
//         backgroundColor: theme.colors.white,
//         borderRadius: theme.borderRadius.sm,
//         cursor: 'pointer',
//         transition: theme.transitions.fast,
//         fontFamily: theme.typography.fontFamily,
//         fontSize: theme.typography.fontSize.sm,
//     },
//     timeRangeButtonActive: {
//         backgroundColor: '#4a90e2',
//         color: theme.colors.white,
//         borderColor: '#3a80d2',
//     },
//     timeRangeButtonHover: {
//         backgroundColor: '#f5f5f5',
//     },
//     placeholder: {
//         padding: theme.spacing.lg,
//         textAlign: 'center' as const,
//         color: theme.colors.textLight,
//     },
// });

// const TemperatureDistributionAnalysis = () => {
//     const selectedStationName = useSelectedStationName();
//     const [timeRange, setTimeRange] = useState<{ from: number; to: number }>({ from: 1961, to: 1990 });
//     const [hoveredButton, setHoveredButton] = useState<number | null>(null);

//     const handleTimeRangeChange = (range: { from: number; to: number }) => {
//         setTimeRange(range);
//     };

//     const stationLabel = selectedStationName ?? 'der aktuell gewählten Stadt';

//     // Time range selector component
//     const TimeRangeSelector = () => {
//         const ranges = [
//             { from: 1961, to: 1990, label: '1961-1990' },
//             { from: 1971, to: 2000, label: '1971-2000' },
//             { from: 1981, to: 2010, label: '1981-2010' },
//         ];

//         return (
//             <div style={styles.timeRangeSelector}>
//                 <h3 style={styles.timeRangeSelectorTitle}>Select Reference Period</h3>
//                 <div style={styles.timeRangeButtons}>
//                     {ranges.map((range) => {
//                         const isActive = timeRange.from === range.from;
//                         const isHovered = hoveredButton === range.from;

//                         const buttonStyle = {
//                             ...styles.timeRangeButton,
//                             ...(isActive && styles.timeRangeButtonActive),
//                             ...(isHovered && !isActive && styles.timeRangeButtonHover),
//                         };

//                         return (
//                             <button
//                                 key={range.from}
//                                 style={buttonStyle}
//                                 onClick={() => handleTimeRangeChange({ from: range.from, to: range.to })}
//                                 onMouseEnter={() => setHoveredButton(range.from)}
//                                 onMouseLeave={() => setHoveredButton(null)}
//                             >
//                                 {range.label}
//                             </button>
//                         );
//                     })}
//                 </div>
//             </div>
//         );
//     };

//     // Tab content
//     const tabs: Tab[] = [
//         {
//             id: 'description',
//             label: 'Description',
//             content: (
//                 <>
//                     <p>See how today's temperature in {stationLabel} compares to the historical distribution from the reference period.</p>
//                     <p>The percentogram visualization shows the distribution of temperatures on this calendar day across all years in the selected period.</p>
//                     <p>Each bar represents an equal percentage of the data, rather than an equal temperature range, making it easier to see where today's temperature falls in the historical record.</p>
//                     <TimeRangeSelector />
//                 </>
//             ),
//         },
//         {
//             id: 'methodology',
//             label: 'Methodology',
//             content: (
//                 <>
//                     <p>The percentogram is a histogram binned by percentiles of the data, rather than using fixed bin widths.</p>
//                     <p>This creates a distribution where each bar has the same number of observations, making it easier to see where a value falls in the distribution.</p>
//                     <p>The color gradient helps visualize the percentile ranges, from blue (lower percentiles) to red (higher percentiles).</p>
//                     <p>The vertical red line indicates today's temperature, allowing you to quickly see if today is unusually warm or cold compared to the historical record.</p>
//                 </>
//             ),
//         },
//     ];

//     // Description with tabs
//     const description = (
//         <>
//             <h2 style={{ marginTop: 0, marginBottom: theme.spacing.md, fontSize: theme.typography.fontSize.xl }}>
//                 Temperature Distribution Analysis
//             </h2>
//             <PlotDescription tabs={tabs} />
//         </>
//     );

//     // Plot placeholder
//     const plot = (
//         <div style={styles.placeholder}>
//             Die Visualisierung wird gerade überarbeitet.
//         </div>
//     );

//     return (
//         <div style={styles.container}>
//             <PlotView
//                 leftContent={description}
//                 rightContent={plot}
//                 leftWidth={30}
//             />
//         </div>
//     );
// };

// export default TemperatureDistributionAnalysis;
