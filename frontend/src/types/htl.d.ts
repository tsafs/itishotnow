declare module 'htl' {
    export const html: (strings: TemplateStringsArray, ...values: unknown[]) => HTMLElement;
    export const svg: (strings: TemplateStringsArray, ...values: unknown[]) => SVGElement;
}
