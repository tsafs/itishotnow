/**
 * Calculates the temperature anomaly between current temperature and historical reference
 * @param {number} currentTemp - The current temperature
 * @param {number} historicalTemp - The historical reference temperature
 * @returns {number|null} The difference (anomaly) or null if inputs are invalid
 */
export const calculateAnomaly = (currentTemp, historicalTemp) => {
    if (currentTemp === undefined || historicalTemp === undefined) {
        return null;
    }
    return currentTemp - historicalTemp;
};

const blueWhiteRedScheme = [
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

const turboScheme = [
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

/**
 * Generates a color based on temperature anomaly
 * @param {number} anomaly - Temperature difference from historical average
 * @returns {string} - HEX color code from blue (cold) to white (neutral) to red (hot) to purple (very hot)
 */
export const getAnomalyColor = (anomaly, colorScheme) => {
    let scheme;
    if (!colorScheme || colorScheme === "BlueWhiteRed") {
        scheme = blueWhiteRedScheme;
    } else if (colorScheme === "Turbo") {
        scheme = turboScheme;
    } else {
        throw new Error(`Unknown color scheme: ${colorScheme}`);
    }

    if (anomaly === null || anomaly === undefined) {
        return "#aaaaaa"; // Default grey color for missing data
    }

    // Find the right color segment for the anomaly
    for (let i = 0; i < scheme.length - 1; i++) {
        if (anomaly >= scheme[i].threshold && anomaly <= scheme[i + 1].threshold) {
            // Linear interpolation between the two color stops
            const ratio = (anomaly - scheme[i].threshold) /
                (scheme[i + 1].threshold - scheme[i].threshold);

            return interpolateColor(scheme[i].color, scheme[i + 1].color, ratio);
        }
    }

    // Handle extremes
    if (anomaly < scheme[0].threshold) return scheme[0].color;
    return scheme[scheme.length - 1].color;
};

/**
 * Interpolates between two hex colors
 * @param {string} color1 - Starting hex color
 * @param {string} color2 - Ending hex color
 * @param {number} ratio - Value between 0 and 1
 * @returns {string} - Interpolated hex color
 */
function interpolateColor(color1, color2, ratio) {
    // Convert hex to rgb
    const hex2rgb = hex => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return [r, g, b];
    };

    // Convert rgb to hex
    const rgb2hex = rgb => {
        return "#" + rgb.map(v => {
            const hex = Math.round(v).toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        }).join("");
    };

    const rgb1 = hex2rgb(color1);
    const rgb2 = hex2rgb(color2);

    // Interpolate
    const rgb = rgb1.map((v, i) => v + (rgb2[i] - v) * ratio);

    return rgb2hex(rgb);
}

/**
 * Analyzes temperature anomaly and returns formatted comparison information
 * @param {number} anomaly - Temperature anomaly value (difference from historical average)
 * @returns {Object} Object containing comparison message and detailed explanation
 */
export const analyzeTemperatureAnomaly = (isLiveData, anomaly) => {
    if (anomaly === undefined || anomaly === null) {
        return {
            comparisonMessage: "Keine Ahnung.",
            anomalyMessage: "Keine historischen Daten verfügbar.",
        };
    }

    let comparisonMessage = null;
    const verb_sein = isLiveData ? "ist" : "war";

    // Determine message based on direct temperature anomaly ranges
    if (anomaly <= -10) {
        comparisonMessage = `Es ${verb_sein} eiskalt!`;
    } else if (anomaly <= -8) {
        comparisonMessage = `Es ${verb_sein} sehr kalt!`;
    } else if (anomaly <= -6) {
        comparisonMessage = `Es ${verb_sein} kalt!`;
    } else if (anomaly <= -4) {
        comparisonMessage = `Es ${verb_sein} sehr kühl!`;
    } else if (anomaly <= -2) {
        comparisonMessage = `Es ${verb_sein} kühl`;
    } else if (anomaly === 0) {
        comparisonMessage = `Es ${verb_sein} exakt durchschnittlich`;
    } else if (anomaly < 2) {
        comparisonMessage = `Es ${verb_sein} ziemlich normal`;
    } else if (anomaly < 4) {
        comparisonMessage = `Es ${verb_sein} warm`;
    } else if (anomaly < 6) {
        comparisonMessage = `Es ${verb_sein} sehr warm!`;
    } else if (anomaly < 8) {
        comparisonMessage = `Es ${verb_sein} heiß!`;
    } else if (anomaly < 10) {
        comparisonMessage = `Es ${verb_sein} sehr heiß!`;
    } else {
        comparisonMessage = `Es ${verb_sein} brütend heiß!`;
    }

    let anomalyMessage = null;
    if (isLiveData) {
        anomalyMessage = `Die zuletzt gemessene Temperatur lag ${Math.abs(anomaly).toFixed(1)}\u00A0°C ${anomaly > 0 ? 'über' : 'unter'} dem stündlichen historischen Mittelwert.`;
    } else {
        anomalyMessage = `Die maximal gemessene Temperatur lag ${Math.abs(anomaly).toFixed(1)}\u00A0°C ${anomaly > 0 ? 'über' : 'unter'} dem maximalen historischen Mittelwert.`;
    }

    return {
        comparisonMessage,
        anomalyMessage
    };
};