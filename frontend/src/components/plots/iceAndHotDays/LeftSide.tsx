import { useMemo, memo } from 'react';
import type { CSSProperties } from 'react';
import { theme } from '../../../styles/design-system.js';
import { useBreakpoint } from '../../../hooks/useBreakpoint.js';
import PlotDescription from '../../common/PlotDescription/PlotDescription.js';

const IceAndHotDaysLeftSide = memo(() => {
    const breakpoint = useBreakpoint();
    const isMobile = breakpoint === 'mobile' || breakpoint === 'tablet';

    const containerStyle = useMemo<CSSProperties>(
        () => ({
            // textAlign: 'right',
            marginRight: isMobile ? 0 : theme.spacing.lg,
        }),
        [isMobile]
    );

    return (
        <PlotDescription style={containerStyle}>
            Ice and hot days analysis plot description goes here.
        </PlotDescription>
    );
});

IceAndHotDaysLeftSide.displayName = 'IceAndHotDaysLeftSide';

export default IceAndHotDaysLeftSide;