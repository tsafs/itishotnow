import { DateTime } from 'luxon';
import deDict from '../i18n/de.json' assert { type: 'json' };
import { registerDictionary, t, type Locale } from '../i18n/i18n.js';

registerDictionary('de', deDict as any);

export type PlotContext = {
    plotId: 'monthlyTemps' | 'monthlyAnomalies';
    city?: string | null;
    locale?: Locale;
    stats?: Partial<{
        currentMonthIndex: number; // 0-11
        currentYear: number;
        currentMonthMean: number | null; // °C
        referenceMonthMean: number | null; // °C
        currentMonthAnomaly: number | null; // °C vs 1961–1990
        recentTrendPerDecade1991Plus: number; // °C/decade
        anomalyDomain: { min: number; max: number };
        completenessMonths: number; // number of months available in current year
    }>;
};

export type DescriptionResult = {
    title: string;
    baseline: string;
    insights: string[];
};

export type DescriptionRule = (ctx: PlotContext) => string | null;

export function composeDescription(
    ns: string,
    titleKey: string,
    baselineKey: string,
    rules: DescriptionRule[],
    ctx: PlotContext,
    maxInsights = -1
): DescriptionResult {
    const city = ctx.city ?? 'dieser Stadt';
    const locale: Locale = ctx.locale ?? 'de';
    const title = t(ns, titleKey, { city }, locale) || `${city}`;
    const baseline = t(ns, baselineKey, {}, locale);
    const insights: string[] = [];
    for (const rule of rules) {
        const s = rule(ctx);
        if (s) insights.push(s);
        if (maxInsights >= 0 && insights.length >= maxInsights) break;
    }
    return { title, baseline, insights };
}

function monthNameDe(index?: number, year?: number) {
    if (index == null || year == null) return null;
    const dt = DateTime.fromObject({ year, month: index + 1 }).setLocale('de');
    return { month: dt.toFormat('LLLL'), year: dt.toFormat('yyyy') };
}

const hasNoAnomaly = (a: number | null): boolean => {
    return a != null && a >= -0.1 && a <= 0.1;
}
const hasPositiveAnomaly = (a: number | null): boolean => {
    return a != null && a > 0.1 && a < 1.5;
}
const hasHighPositiveAnomaly = (a: number | null): boolean => {
    return a != null && a >= 1.5;
}
const hasHighNegativeAnomaly = (a: number | null): boolean => {
    return a != null && a <= -1.5;
}
const hasNegativeAnomaly = (a: number | null): boolean => {
    return a != null && a < -0.1 && a > -1.5;
}

const hasNoTrend = (slope: number | null): boolean => {
    return slope != null && slope >= -0.1 && slope <= 0.1;
}
const hasPositiveTrend = (slope: number | null): boolean => {
    return slope != null && slope > 0.1 && slope < 0.3;
}
const hasHighPositiveTrend = (slope: number | null): boolean => {
    return slope != null && slope >= 0.3;
}
const hasHighNegativeTrend = (slope: number | null): boolean => {
    return slope != null && slope <= -0.3;
}
const hasNegativeTrend = (slope: number | null): boolean => {
    return slope != null && slope < -0.1 && slope > -0.3;
}

export const monthlyTempsRules: DescriptionRule[] = [
    (ctx) => {
        const m = monthNameDe(ctx.stats?.currentMonthIndex, ctx.stats?.currentYear);
        const completeness = ctx.stats?.completenessMonths;
        if (!m || !completeness || completeness >= 12) return null;
        return t('plots.monthlyTemps', 'insight.completeness', { month: m.month, year: m.year });
    },
    (ctx) => {
        const a = ctx.stats?.currentMonthAnomaly;
        if (a == null) return null;
        if (hasNoAnomaly(a)) return t('plots.monthlyTemps', 'insight.noAnomaly');
        if (hasPositiveAnomaly(a)) return t('plots.monthlyTemps', 'insight.positive');
        if (hasHighPositiveAnomaly(a)) return t('plots.monthlyTemps', 'insight.highPositive');
        if (hasHighNegativeAnomaly(a)) return t('plots.monthlyTemps', 'insight.highNegative');
        if (hasNegativeAnomaly(a)) return t('plots.monthlyTemps', 'insight.negative');
        return null;
    },
    (ctx) => {
        const slope = ctx.stats?.recentTrendPerDecade1991Plus;
        if (slope == null) return null;
        if (hasNoTrend(slope)) return t('plots.monthlyTemps', 'insight.noTrend');
        if (hasPositiveTrend(slope)) return t('plots.monthlyTemps', 'insight.trendUp', { trend: slope.toFixed(2) });
        if (hasHighPositiveTrend(slope)) return t('plots.monthlyTemps', 'insight.highTrendUp', { trend: slope.toFixed(2) });
        if (hasHighNegativeTrend(slope)) return t('plots.monthlyTemps', 'insight.highTrendDown', { trend: slope.toFixed(2) });
        if (hasNegativeTrend(slope)) return t('plots.monthlyTemps', 'insight.trendDown', { trend: slope.toFixed(2) });
        return null;
    },
];

export const monthlyAnomaliesRules: DescriptionRule[] = [
    (ctx) => {
        const a = ctx.stats?.currentMonthAnomaly;
        if (a == null) return null;
        if (hasNoAnomaly(a)) return t('plots.monthlyAnomalies', 'insight.noAnomaly');
        if (hasPositiveAnomaly(a)) return t('plots.monthlyAnomalies', 'insight.positive');
        if (hasHighPositiveAnomaly(a)) return t('plots.monthlyAnomalies', 'insight.highPositive');
        if (hasHighNegativeAnomaly(a)) return t('plots.monthlyAnomalies', 'insight.highNegative');
        if (hasNegativeAnomaly(a)) return t('plots.monthlyAnomalies', 'insight.negative');
        return null;
    },
    (ctx) => {
        const slope = ctx.stats?.recentTrendPerDecade1991Plus;
        if (slope == null) return null;
        if (hasNoTrend(slope)) return t('plots.monthlyAnomalies', 'insight.noTrend');
        if (hasPositiveTrend(slope)) return t('plots.monthlyAnomalies', 'insight.trendUp', { trend: slope.toFixed(2) });
        if (hasHighPositiveTrend(slope)) return t('plots.monthlyAnomalies', 'insight.highTrendUp', { trend: slope.toFixed(2) });
        if (hasHighNegativeTrend(slope)) return t('plots.monthlyAnomalies', 'insight.highTrendDown', { trend: slope.toFixed(2) });
        if (hasNegativeTrend(slope)) return t('plots.monthlyAnomalies', 'insight.trendDown', { trend: slope.toFixed(2) });
        return null;
    },
    (ctx) => {
        const m = monthNameDe(ctx.stats?.currentMonthIndex, ctx.stats?.currentYear);
        const completeness = ctx.stats?.completenessMonths;
        if (!m || !completeness || completeness >= 12) return null;
        return t('plots.monthlyAnomalies', 'insight.completeness', { month: m.month, year: m.year });
    },
];

export function getMonthlyTempsDescription(ctx: PlotContext): DescriptionResult {
    return composeDescription(
        'plots.monthlyTemps',
        'title',
        'baseline',
        monthlyTempsRules,
        ctx
    );
}

export function getMonthlyAnomaliesDescription(ctx: PlotContext): DescriptionResult {
    return composeDescription(
        'plots.monthlyAnomalies',
        'title',
        'baseline',
        monthlyAnomaliesRules,
        ctx
    );
}
