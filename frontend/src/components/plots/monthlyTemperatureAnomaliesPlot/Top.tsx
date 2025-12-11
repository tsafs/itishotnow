import { memo, useMemo, type CSSProperties } from 'react';
import { createStyles, theme } from '../../../styles/design-system.js';
import PlotDescription from '../../common/PlotDescription/PlotDescription.js';
import useBreakpoint from '../../../hooks/useBreakpoint.js';
import { getMonthlyAnomaliesDescription } from '../../../services/description/descriptionEngine.js';
import { useSelectedCityName } from '../../../store/hooks/hooks.js';
import { usePlotData } from './hooks/usePlotData.js';

const getContainerStyle = (isMobile: boolean): CSSProperties => ({
    textAlign: 'center',
    color: theme.colors.textDark,
    marginBottom: 8,
});

const styles = createStyles({
    title: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 12,
        opacity: 0.9,
    }
});

const MonthlyTemperatureAnomaliesTop = memo(() => {
    const breakpoint = useBreakpoint();
    const isMobile = breakpoint === 'mobile' || breakpoint === 'tablet';

    const containerStyle = useMemo(() => getContainerStyle(isMobile), [isMobile]);

    const city = useSelectedCityName();
    const { stats } = usePlotData();
    const ctx = {
        plotId: 'monthlyAnomalies' as const,
        city,
        locale: 'de' as const,
        ...(stats ? { stats } : {}),
    };

    const { title, baseline, insights } = getMonthlyAnomaliesDescription(ctx);

    return (
        <PlotDescription style={containerStyle}>
            <div style={styles.title}>{title}</div>
            <div style={styles.subtitle}>{baseline}</div>
            {insights.map((s, i) => (
                <div key={i} style={styles.subtitle}>{s}</div>
            ))}
        </PlotDescription>
    );
});

MonthlyTemperatureAnomaliesTop.displayName = 'MonthlyTemperatureAnomaliesTop';

export default MonthlyTemperatureAnomaliesTop;
