import { useMemo, useState } from 'react';
import type { ReactNode, CSSProperties } from 'react';
import { theme } from '../../../styles/design-system';

// Pure style computation functions
const getContainerStyle = (hasTabs: boolean, customStyle?: CSSProperties): CSSProperties => ({
    paddingRight: theme.spacing.sm,
    height: '100%',
    maxWidth: 600,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: hasTabs ? 'flex-start' : 'center',
    textAlign: 'left',
    ...customStyle,
});

const getTabBarStyle = (): CSSProperties => ({
    display: 'flex',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    borderBottom: `2px solid ${theme.colors.borderLight}`,
});

const getTabButtonStyle = (isActive: boolean, isHovered: boolean): CSSProperties => ({
    padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
    background: 'none',
    border: 'none',
    borderBottom: `2px solid ${isActive ? theme.colors.text : 'transparent'}`,
    marginBottom: -2,
    cursor: 'pointer',
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.fontSize.md,
    fontWeight: isActive ? theme.typography.fontWeight.bold : theme.typography.fontWeight.medium,
    color: isActive ? theme.colors.text : theme.colors.textLight,
    backgroundColor: isHovered && !isActive ? theme.colors.hover : 'transparent',
    transition: `all ${theme.transitions.fast}`,
});

const getContentStyle = (): CSSProperties => ({
    lineHeight: theme.typography.lineHeight.normal,
});

export interface Tab {
    id: string;
    label: string;
    content: ReactNode;
}

interface PlotDescriptionProps {
    children?: ReactNode;
    tabs?: Tab[];
    className?: string;
    style?: CSSProperties;
}

/**
 * PlotDescription Component
 * 
 * A standardized component for displaying plot descriptions and explanations.
 * Supports both simple content and tabbed content for more complex descriptions.
 * 
 * @param children - Simple description content (used when tabs is not provided)
 * @param tabs - Array of tabs with id, label, and content
 * @param className - Additional CSS class name
 * @param style - Additional inline styles
 * 
 * @example
 * // Simple usage
 * <PlotDescription>
 *   <p>This chart shows temperature data...</p>
 * </PlotDescription>
 * 
 * @example
 * // With tabs
 * <PlotDescription
 *   tabs={[
 *     { id: 'description', label: 'Description', content: <p>...</p> },
 *     { id: 'methodology', label: 'Methodology', content: <p>...</p> }
 *   ]}
 * />
 */
const PlotDescription = ({
    children,
    tabs,
    className = '',
    style,
}: PlotDescriptionProps) => {
    const [activeTab, setActiveTab] = useState<string>(tabs?.[0]?.id ?? '');
    const [hoveredTab, setHoveredTab] = useState<string | null>(null);

    const hasTabs = tabs && tabs.length > 0;

    // Memoized styles
    const containerStyle = useMemo(
        () => getContainerStyle(!!hasTabs, style),
        [hasTabs, style]
    );

    const tabBarStyle = useMemo(() => getTabBarStyle(), []);
    const contentStyle = useMemo(() => getContentStyle(), []);

    // Simple content without tabs
    if (!hasTabs) {
        return (
            <div className={className} style={containerStyle}>
                <div style={contentStyle}>{children}</div>
            </div>
        );
    }

    // Tabbed content
    const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content;

    return (
        <div className={className} style={containerStyle}>
            <div style={tabBarStyle}>
                {tabs.map(tab => {
                    const isActive = tab.id === activeTab;
                    const isHovered = tab.id === hoveredTab;

                    const buttonStyle = useMemo(
                        () => getTabButtonStyle(isActive, isHovered),
                        [isActive, isHovered]
                    );

                    return (
                        <button
                            key={tab.id}
                            style={buttonStyle}
                            onClick={() => setActiveTab(tab.id)}
                            onMouseEnter={() => setHoveredTab(tab.id)}
                            onMouseLeave={() => setHoveredTab(null)}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>
            <div style={contentStyle}>{activeTabContent}</div>
        </div>
    );
};

export default PlotDescription;