import { useMemo, memo } from 'react';
import type { CSSProperties } from 'react';
import StationDetails from './StationDetails.js';
import { theme } from '../../../styles/design-system.js';
import { useBreakpoint } from '../../../hooks/useBreakpoint.js';

// Pure style computation functions
const getInfoStyle = (isMobile: boolean): CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: isMobile ? 'center' : 'flex-start',
    height: '100%',
    gap: theme.spacing.lg,
    marginTop: isMobile ? 0 : '30%',
    marginRight: isMobile ? 0 : theme.spacing.lg,
});

const HeatmapGermanyLeftSide = memo(() => {
    const breakpoint = useBreakpoint();
    const isMobile = breakpoint === 'mobile' || breakpoint === 'tablet';

    const infoStyle = useMemo(
        () => getInfoStyle(isMobile),
        [isMobile]
    );

    return (
        <div style={infoStyle}>
            <StationDetails />
        </div>
    );
});

HeatmapGermanyLeftSide.displayName = 'HeatmapGermanyLeftSide';

export default HeatmapGermanyLeftSide;
