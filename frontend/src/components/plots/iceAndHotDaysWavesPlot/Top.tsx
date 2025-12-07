import { useMemo, memo } from 'react';
import type { CSSProperties } from 'react';
import { theme } from '../../../styles/design-system.js';
import { useBreakpoint } from '../../../hooks/useBreakpoint.js';
import PlotDescription from '../../common/PlotDescription/PlotDescription.js';

const getContainerStyle = (isMobile: boolean): CSSProperties => ({
    textAlign: 'center',
    marginRight: isMobile ? 0 : theme.spacing.lg,
    color: theme.colors.textLight,
});

const IceAndHotDaysLeftSide = memo(() => {
    const breakpoint = useBreakpoint();
    const isMobile = breakpoint === 'mobile' || breakpoint === 'tablet';

    const containerStyle = useMemo(() => getContainerStyle(isMobile), [isMobile]);

    return (
        <PlotDescription style={containerStyle}>
            Todo
        </PlotDescription>
    );
});

IceAndHotDaysLeftSide.displayName = 'IceAndHotDaysLeftSide';

export default IceAndHotDaysLeftSide;