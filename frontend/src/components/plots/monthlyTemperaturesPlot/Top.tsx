import { useMemo, memo } from 'react';
import type { CSSProperties } from 'react';
import { createStyles, theme } from '../../../styles/design-system.js';
import { useBreakpoint } from '../../../hooks/useBreakpoint.js';
import PlotDescription from '../../common/PlotDescription/PlotDescription.js';

const getContainerStyle = (isMobile: boolean): CSSProperties => ({
    textAlign: 'center',
    color: theme.colors.textLight,
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

const IceAndHotDaysLeftSide = memo(() => {
    const breakpoint = useBreakpoint();
    const isMobile = breakpoint === 'mobile' || breakpoint === 'tablet';

    const containerStyle = useMemo(() => getContainerStyle(isMobile), [isMobile]);

    return (
        <PlotDescription style={containerStyle}>
            <div style={styles.title}>Monatliche Temperaturen</div>
            <div style={styles.subtitle}>Referenzzeitraum: 1961–1990.</div>
        </PlotDescription>
    );
});

IceAndHotDaysLeftSide.displayName = 'IceAndHotDaysLeftSide';

export default IceAndHotDaysLeftSide;