import type { CSSProperties } from "react";

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
    Object.entries(rules).forEach(([selector, declarations]) => {
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