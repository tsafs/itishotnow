import { useMemo } from 'react';
import type { ReactNode, CSSProperties } from 'react';
import { theme } from '../../../styles/design-system';

// Pure style computation functions
const getContainerStyle = (darkMode: boolean, customStyle?: CSSProperties): CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    boxSizing: 'border-box',
    marginBottom: theme.spacing.lg,
    backgroundColor: darkMode ? theme.colors.background : theme.colors.backgroundLight,
    padding: theme.spacing.lg,
    ...customStyle,
});

const getTopSectionStyle = (): CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
});

const getBottomSectionStyle = (): CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
});

interface StackedPlotViewProps {
    topContent: ReactNode;
    bottomContent: ReactNode;
    className?: string;
    style?: CSSProperties;
    darkMode?: boolean; // Whether to use dark mode styles (default: false)
}

export interface StackedPlotViewBottomProps {
    darkMode?: boolean | undefined;
}

/**
 * StackedPlotView Component
 * 
 * A layout component that stacks content vertically with description/title on top
 * and visualization below.
 * 
 * @param topContent - Content to display on top (e.g., description)
 * @param bottomContent - Content to display on bottom (e.g., chart/visualization)
 * @param className - Additional CSS class name
 * @param style - Additional inline styles
 * @param darkMode - Whether to use dark mode styles (default: false)
 * 
 * @example
 * <StackedPlotView
 *   topContent={<Description />}
 *   bottomContent={<Chart />}
 *   darkMode={true}
 * />
 */
const StackedPlotView = ({
    topContent,
    bottomContent,
    className = '',
    style,
    darkMode = false,
}: StackedPlotViewProps) => {
    // Memoized computed styles
    const containerStyle = useMemo(
        () => getContainerStyle(darkMode, style),
        [darkMode, style]
    );

    const topSectionStyle = useMemo(() => getTopSectionStyle(), []);

    const bottomSectionStyle = useMemo(() => getBottomSectionStyle(), []);

    return (
        <div className={className} style={containerStyle}>
            <div style={topSectionStyle}>
                {topContent}
            </div>
            <div style={bottomSectionStyle}>
                {bottomContent}
            </div>
        </div>
    );
};

export default StackedPlotView;
