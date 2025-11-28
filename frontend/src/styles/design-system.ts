import type { CSSProperties } from 'react';

/**
 * Design System Tokens
 * 
 * Centralized design tokens for consistent styling across the application.
 * All spacing, colors, typography, and breakpoints are defined here.
 */

export const theme = {
    spacing: {
        none: 0,
        xs: 4,
        sm: 8,
        md: 15,
        lg: 20,
        xl: 30,
        xxl: 40,
    },
    colors: {
        // Backgrounds
        background: '#222222',
        backgroundLight: '#eeeeee',
        white: '#ffffff',

        // Text
        textDark: '#222222',
        textLight: '#dddddd',
        textWhite: '#ffffff',
        textBlack: '#000000',

        // UI Elements
        border: '#ddd',
        borderLight: '#e5e5e5',

        // Temperature colors (matching your Observable Plot schemes)
        cold: '#4575b4',
        hot: '#d73027',
        neutral: '#999999',

        // Hightlights
        primary: 'rgb(7, 87, 156)',
        secondary: '#ff9800',
        accent: '#4caf50',

        // Interactive
        hover: 'rgba(0, 0, 0, 0.05)',
        active: 'rgba(0, 0, 0, 0.1)',
    },
    typography: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        fontSize: {
            xs: '12px',
            sm: '14px',
            md: '16px',
            lg: '18px',
            xl: '20px',
            xxl: '24px',
            title: '1.5rem',
        },
        fontWeight: {
            normal: 400,
            medium: 500,
            bold: 700,
        },
        lineHeight: {
            tight: 1.2,
            normal: 1.5,
            relaxed: 1.8,
        },
    },
    breakpoints: {
        mobile: 480,
        tablet: 768,
        desktop: 1024,
        wide: 1440,
    },
    shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    },
    borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        full: '9999px',
    },
    transitions: {
        fast: '150ms ease',
        normal: '250ms ease',
        slow: '350ms ease',
    },
} as const;

/**
 * Type-safe style creator
 * 
 * Helps create style objects with TypeScript autocomplete
 */
export const createStyles = <T extends Record<string, CSSProperties>>(
    styles: T
): T => styles;

/**
 * Responsive utilities
 * 
 * Helper functions for responsive styling based on breakpoints
 */
export const media = {
    mobile: `@media (max-width: ${theme.breakpoints.mobile}px)`,
    tablet: `@media (max-width: ${theme.breakpoints.tablet}px)`,
    desktop: `@media (max-width: ${theme.breakpoints.desktop}px)`,
    wide: `@media (min-width: ${theme.breakpoints.wide}px)`,
} as const;

/**
 * Common style mixins
 * 
 * Reusable style patterns
 */
export const mixins = {
    flexCenter: (): CSSProperties => ({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    }),
    flexColumn: (): CSSProperties => ({
        display: 'flex',
        flexDirection: 'column',
    }),
    absoluteFill: (): CSSProperties => ({
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    }),
    visuallyHidden: (): CSSProperties => ({
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
    }),
} as const;

/**
 * Utility function to merge styles
 * 
 * Allows combining multiple style objects with proper typing
 */
export const mergeStyles = (
    ...styles: (CSSProperties | undefined | false)[]
): CSSProperties => {
    return styles.reduce<CSSProperties>((acc, style) => {
        if (style) {
            return { ...acc, ...style };
        }
        return acc;
    }, {});
};

/**
 * Breakpoint-specific style helper
 * 
 * Returns different styles based on breakpoint
 */
export const responsiveStyle = (
    breakpoint: 'mobile' | 'tablet' | 'desktop',
    styles: {
        mobile?: CSSProperties;
        tablet?: CSSProperties;
        desktop?: CSSProperties;
    }
): CSSProperties => {
    if (breakpoint === 'mobile' && styles.mobile) {
        return styles.mobile;
    }
    if (breakpoint === 'tablet' && styles.tablet) {
        return styles.tablet;
    }
    if (breakpoint === 'desktop' && styles.desktop) {
        return styles.desktop;
    }
    return {};
};

/**
 * CSS Variables generator
 * 
 * Generates CSS custom properties from the theme for use in global.css
 */
export const generateCSSVariables = (): string => {
    const variables: string[] = [];

    // Spacing
    Object.entries(theme.spacing).forEach(([key, value]) => {
        variables.push(`--spacing-${key}: ${value}px;`);
    });

    // Colors
    Object.entries(theme.colors).forEach(([key, value]) => {
        variables.push(`--color-${key}: ${value};`);
    });

    // Typography
    Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
        variables.push(`--font-size-${key}: ${value};`);
    });

    // Breakpoints
    Object.entries(theme.breakpoints).forEach(([key, value]) => {
        variables.push(`--breakpoint-${key}: ${value}px;`);
    });

    return `:root {\n  ${variables.join('\n  ')}\n}`;
};

// Export the theme as default for convenience
export default theme;
