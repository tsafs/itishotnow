import { memo, useMemo, type CSSProperties } from 'react';
import { createStyles, theme } from '../../../styles/design-system.js';
import PlotDescription from '../../common/PlotDescription/PlotDescription.js';
import useBreakpoint from '../../../hooks/useBreakpoint.js';

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

    return (
        <PlotDescription style={containerStyle}>
            <div style={styles.title}>Monatliche Temperatur-Anomalien</div>
            <div style={styles.subtitle}>Referenzzeitraum: 1961–1990. Positive Werte = wärmer als Referenz, negative = kälter.</div>
        </PlotDescription>
    );
});

MonthlyTemperatureAnomaliesTop.displayName = 'MonthlyTemperatureAnomaliesTop';

export default MonthlyTemperatureAnomaliesTop;
