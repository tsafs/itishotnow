import { useMemo } from 'react';
import type { ReactNode, CSSProperties } from 'react';
import { theme } from '../../../styles/design-system';
import { useBreakpoint } from '../../../hooks/useBreakpoint';

// Pure style computation functions
const getContainerStyle = (isMobile: boolean, darkMode: boolean, customStyle?: CSSProperties): CSSProperties => ({
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    width: '100%',
    minHeight: isMobile ? 'auto' : 400,
    boxSizing: 'border-box',
    marginBottom: theme.spacing.lg,
    backgroundColor: darkMode ? theme.colors.background : theme.colors.backgroundLight,
    padding: isMobile ? theme.spacing.lg : 0,
    ...customStyle,
});

const getSideStyle = (
    isMobile: boolean,
    position: 'first' | 'second',
    ratio: number
): CSSProperties => ({
    padding: isMobile ? 0 : theme.spacing.md,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: isMobile ? 'center' : (position === 'first' ? 'flex-end' : 'flex-start'),
    textAlign: isMobile ? 'center' : (position === 'first' ? 'right' : 'left'),
    ...(!isMobile && { flex: ratio }),
});

const getTitleStyle = (isMobile: boolean, titleSide: 'left' | 'right'): CSSProperties => ({
    width: '100%',
    textAlign: isMobile ? 'center' : (titleSide === 'left' ? 'right' : 'left'),
    fontSize: isMobile ? theme.typography.fontSize.lg : theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing.md,
    marginTop: isMobile ? theme.spacing.md : 0
});

interface PlotViewProps {
    leftContent: ReactNode;
    rightContent: ReactNode;
    className?: string;
    style?: CSSProperties;
    leftWidth?: number; // Percentage (0-100)
    title?: string; // Optional plot title
    titleSide?: 'left' | 'right'; // Where to render the title (default: right)
    darkMode?: boolean; // Whether to use dark mode styles (default: false)
}

/**
 * PlotView Component
 * 
 * A reusable layout component that splits content into two sides with configurable width.
 * Automatically stacks content vertically on mobile devices.
 * 
 * @param leftContent - Content to display on the left (or top on mobile)
 * @param rightContent - Content to display on the right (or bottom on mobile)
 * @param className - Additional CSS class name
 * @param style - Additional inline styles
 * @param leftWidth - Width percentage for left content (0-100, default: 33)
 * 
 * @example
 * <PlotView
 *   leftContent={<Description />}
 *   rightContent={<Chart />}
 *   leftWidth={40}
 * />
 */
const PlotView = ({
    leftContent,
    rightContent,
    className = '',
    style,
    leftWidth = 33,
    title,
    titleSide = 'right',
    darkMode = false,
}: PlotViewProps) => {
    const breakpoint = useBreakpoint();
    const isMobile = breakpoint === 'mobile' || breakpoint === 'tablet';

    const rightWidth = 100 - leftWidth;

    // Memoized computed styles
    const containerStyle = useMemo(
        () => getContainerStyle(isMobile, darkMode, style),
        [isMobile, darkMode, style]
    );

    const leftSideStyle = useMemo(
        () => getSideStyle(isMobile, 'first', leftWidth),
        [isMobile, leftWidth]
    );

    const rightSideStyle = useMemo(
        () => getSideStyle(isMobile, 'second', rightWidth),
        [isMobile, rightWidth]
    );

    const titleStyle = useMemo(() => getTitleStyle(isMobile, titleSide), [isMobile, titleSide]);

    const Title = () => (title ? (<div style={titleStyle}>{title}</div>) : null);

    return (
        <div className={className} style={containerStyle}>
            <div style={leftSideStyle}>
                {title && titleSide === 'left' && <Title />}
                {leftContent}
            </div>
            <div style={rightSideStyle}>
                {title && titleSide === 'right' && <Title />}
                {rightContent}
            </div>
        </div>
    );
};

export default PlotView;