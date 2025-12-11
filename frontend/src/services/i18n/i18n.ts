export type Locale = 'de' | 'en';

export type Dictionary = Record<string, Record<string, string>>;

const dictionaries: Record<Locale, Dictionary> = {
    de: {},
    en: {},
};

export function registerDictionary(locale: Locale, dict: Dictionary) {
    dictionaries[locale] = { ...dictionaries[locale], ...dict };
}

export function t(ns: string, key: string, params?: Record<string, string | number>, locale: Locale = 'de') {
    const dict = dictionaries[locale] ?? {};
    const text = dict[ns]?.[key] ?? '';
    if (!text) return '';
    if (!params) return text;
    return Object.keys(params).reduce((acc, k) => acc.replace(new RegExp(`\\{${k}\\}`, 'g'), String(params[k])), text);
}
