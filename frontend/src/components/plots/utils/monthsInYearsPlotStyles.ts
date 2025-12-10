import type { CSSProperties } from "react";
import theme from "../../../styles/design-system";

export const MONTH_LABELS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

export type PlotStyleRuleConfig = Readonly<Record<string, CSSProperties>>;

const toKebabCase = (property: string) =>
    property.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);

const toCssValue = (value: CSSProperties[keyof CSSProperties]) => {
    if (value == null) return null;
    if (Array.isArray(value)) return value.join(' ');
    return typeof value === 'number' ? `${value}` : String(value);
};

export const applyPlotStyles = (root: ParentNode | null, rules: PlotStyleRuleConfig) => {
    if (!root) return;

    const maybeStyleRoot = (selector: string, declarations: CSSProperties) => {
        const el = root as Element & ElementCSSInlineStyle;
        if (el.matches && el.matches(selector)) {
            Object.entries(declarations).forEach(([property, value]) => {
                const cssValue = toCssValue(value);
                if (cssValue == null) return;
                const cssProperty = property.startsWith('--') ? property : toKebabCase(property);
                el.style.setProperty(cssProperty, cssValue);
            });
        }
    };

    Object.entries(rules).forEach(([selector, declarations]) => {
        // Apply to root if it matches
        maybeStyleRoot(selector, declarations);

        // Apply to descendants
        root.querySelectorAll<Element & ElementCSSInlineStyle>(selector).forEach((node) => {
            Object.entries(declarations).forEach(([property, value]) => {
                const cssValue = toCssValue(value);
                if (cssValue == null) return;
                const cssProperty = property.startsWith('--') ? property : toKebabCase(property);
                node.style.setProperty(cssProperty, cssValue);
            });
        });
    });
};

export const getPlotStyleRules = (isMobile: boolean, fontSize: number, isDarkMode: boolean): PlotStyleRuleConfig => {
    const currentThemeColors = isDarkMode ? theme.colors.plotDark : theme.colors.plotLight;
    const axisColor = currentThemeColors.text;
    return {
        'g[aria-label="y-axis label"]': {
            fontWeight: 'bold',
            fontSize,
            color: axisColor,
            fill: axisColor,
        },
        'line[aria-label="frame"]': {
            strokeWidth: 2
        },
        'g[aria-label="y-axis tick"] > path': {
            strokeWidth: 2
        },
        'figure': {
            display: 'flex',
            flexDirection: 'column-reverse', // to place legend at bottom
            alignItems: 'center',
            flexWrap: 'nowrap',
        },
        '.legend-swatches-wrap': {
            marginLeft: isMobile ? '5px' : '40px', // to align with x-axis center
            marginBottom: 0, // reset default margin
            gap: isMobile ? '8px' : '16px',
            minHeight: 0, // reset default minHeight
        },
        '.legend-swatch': {
            marginRight: 0, // reset default margin
        },
        '.legend-swatch > svg': {
            width: isMobile ? 10 : 15,
            height: isMobile ? 10 : 15,
        }
    };
};