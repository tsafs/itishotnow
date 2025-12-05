import { useMemo, memo } from 'react';
import type { CSSProperties } from 'react';
import StationDetails from './StationDetails.js';
import { theme } from '../../../styles/design-system.js';
import { useBreakpoint } from '../../../hooks/useBreakpoint.js';
import PlotDescription from '../../common/PlotDescription/PlotDescription.js';

const HeatmapGermanyLeftSide = memo(() => {
    const breakpoint = useBreakpoint();
    const isMobile = breakpoint === 'mobile' || breakpoint === 'tablet';

    const containerStyle = useMemo<CSSProperties>(
        () => ({
            marginRight: isMobile ? 0 : theme.spacing.lg,
        }),
        [isMobile]
    );

    return (
        <PlotDescription style={containerStyle}>
            <StationDetails />
        </PlotDescription>
    );
});

HeatmapGermanyLeftSide.displayName = 'HeatmapGermanyLeftSide';

export default HeatmapGermanyLeftSide;
