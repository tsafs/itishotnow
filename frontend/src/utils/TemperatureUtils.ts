export type ColorSchemeName = 'BlueWhiteRed' | 'Turbo';

interface ColorStop {
    threshold: number;
    color: string;
}

const blueWhiteRedScheme: ColorStop[] = [
    { threshold: -10, color: "#13437D" },
    { threshold: -8, color: "#07579C" },
    { threshold: -6, color: "#3A7D9D" },
    { threshold: -4, color: "#78BFD6" },
    { threshold: -2, color: "#DBF6FF" },
    { threshold: 0, color: "#FFFFFF" },
    { threshold: 2, color: "#FFE0E0" },
    { threshold: 4, color: "#FB9171" },
    { threshold: 6, color: "#F03C2B" },
    { threshold: 8, color: "#A60F13" },
    { threshold: 10, color: "#5F0000" }
];

const turboScheme: ColorStop[] = [
    { threshold: -10, color: "#23171B" },
    { threshold: -8, color: "#4B48C3" },
    { threshold: -6, color: "#238FF8" },
    { threshold: -4, color: "#25CECF" },
    { threshold: -2, color: "#44F58D" },
    { threshold: 0, color: "#8AFC56" },
    { threshold: 2, color: "#D8E135" },
    { threshold: 4, color: "#FFA924" },
    { threshold: 6, color: "#F86218" },
    { threshold: 8, color: "#BC2309" },
    { threshold: 10, color: "#900C00" }
];

/** Generates a color for the provided temperature anomaly. */
export const getAnomalyColor = (
    anomaly: number | null | undefined,
    colorScheme?: ColorSchemeName,
): string => {
    let scheme: ColorStop[];
    if (!colorScheme || colorScheme === 'BlueWhiteRed') {
        scheme = blueWhiteRedScheme;
    } else if (colorScheme === 'Turbo') {
        scheme = turboScheme;
    } else {
        throw new Error(`Unknown color scheme: ${colorScheme}`);
    }

    if (anomaly === null || anomaly === undefined || Number.isNaN(anomaly) || !Number.isFinite(anomaly)) {
        return '#aaaaaa';
    }

    for (let i = 0; i < scheme.length - 1; i += 1) {
        const current = scheme[i];
        const next = scheme[i + 1];

        if (!current || !next) {
            continue;
        }
        if (anomaly >= current.threshold && anomaly <= next.threshold) {
            const ratio = (anomaly - current.threshold) / (next.threshold - current.threshold);
            return interpolateColor(current.color, next.color, ratio);
        }
    }

    const firstStop = scheme[0];
    if (firstStop && anomaly < firstStop.threshold) {
        return firstStop.color;
    }
    const lastStop = scheme[scheme.length - 1];
    return lastStop ? lastStop.color : '#aaaaaa';
};

/**
 * Interpolates between two hex colors
 * @param {string} color1 - Starting hex color
 * @param {string} color2 - Ending hex color
 * @param {number} ratio - Value between 0 and 1
 * @returns {string} - Interpolated hex color
 */
function interpolateColor(color1: string, color2: string, ratio: number): string {
    const hex2rgb = (hex: string): [number, number, number] => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return [r, g, b];
    };

    const rgb2hex = (rgb: [number, number, number]): string => {
        return `#${rgb
            .map((v) => {
                const hex = Math.round(v).toString(16);
                return hex.length === 1 ? `0${hex}` : hex;
            })
            .join('')}`;
    };

    const rgb1 = hex2rgb(color1);
    const rgb2 = hex2rgb(color2);
    const clampedRatio = Math.min(Math.max(ratio, 0), 1);
    const rgb: [number, number, number] = [
        rgb1[0] + (rgb2[0] - rgb1[0]) * clampedRatio,
        rgb1[1] + (rgb2[1] - rgb1[1]) * clampedRatio,
        rgb1[2] + (rgb2[2] - rgb1[2]) * clampedRatio,
    ];

    return rgb2hex(rgb);
}

export interface TemperatureAnomalyDetails {
    comparisonMessage: string;
    anomalyMessage: string;
}

/** Returns localized strings describing a temperature anomaly. */
export const analyzeTemperatureAnomaly = (
    isLiveData: boolean,
    anomaly: number | null | undefined,
): TemperatureAnomalyDetails => {
    if (anomaly === undefined || anomaly === null) {
        return {
            comparisonMessage: 'Keine Ahnung.',
            anomalyMessage: 'Keine historischen Daten verfügbar.',
        };
    }

    const verbSein = isLiveData ? 'ist' : 'war';
    let comparisonMessage: string;

    if (anomaly <= -10) {
        comparisonMessage = `Es ${verbSein} eiskalt!`;
    } else if (anomaly <= -8) {
        comparisonMessage = `Es ${verbSein} sehr kalt!`;
    } else if (anomaly <= -6) {
        comparisonMessage = `Es ${verbSein} kalt!`;
    } else if (anomaly <= -4) {
        comparisonMessage = `Es ${verbSein} sehr kühl!`;
    } else if (anomaly <= -2) {
        comparisonMessage = `Es ${verbSein} kühl`;
    } else if (anomaly === 0) {
        comparisonMessage = `Es ${verbSein} exakt durchschnittlich`;
    } else if (anomaly < 2) {
        comparisonMessage = `Es ${verbSein} ziemlich normal`;
    } else if (anomaly < 4) {
        comparisonMessage = `Es ${verbSein} warm`;
    } else if (anomaly < 6) {
        comparisonMessage = `Es ${verbSein} sehr warm!`;
    } else if (anomaly < 8) {
        comparisonMessage = `Es ${verbSein} heiß!`;
    } else if (anomaly < 10) {
        comparisonMessage = `Es ${verbSein} sehr heiß!`;
    } else {
        comparisonMessage = `Es ${verbSein} brütend heiß!`;
    }

    const anomalyMagnitude = Math.abs(anomaly).toFixed(1);
    const direction = anomaly > 0 ? 'über' : 'unter';

    const anomalyMessage = isLiveData
        ? `Die zuletzt gemessene Temperatur lag ${anomalyMagnitude}\u00A0°C ${direction} dem stündlichen historischen Mittelwert.`
        : `Die maximal gemessene Temperatur lag ${anomalyMagnitude}\u00A0°C ${direction} dem maximalen historischen Mittelwert.`;

    return {
        comparisonMessage,
        anomalyMessage,
    };
};