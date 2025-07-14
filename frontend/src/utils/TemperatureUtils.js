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

/**
 * Generates a color based on temperature anomaly
 * @param {number} anomaly - Temperature difference from historical average
 * @returns {string} - HEX color code from blue (cold) to white (neutral) to red (hot) to purple (very hot)
 */
export const getAnomalyColor = (anomaly) => {
    if (anomaly === null || anomaly === undefined) {
        return "#aaaaaa"; // Default grey color for missing data
    }

    // Define our color stops for the gradient
    const colorStops = [
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

    // Find the right color segment for the anomaly
    for (let i = 0; i < colorStops.length - 1; i++) {
        if (anomaly >= colorStops[i].threshold && anomaly <= colorStops[i + 1].threshold) {
            // Linear interpolation between the two color stops
            const ratio = (anomaly - colorStops[i].threshold) /
                (colorStops[i + 1].threshold - colorStops[i].threshold);

            return interpolateColor(colorStops[i].color, colorStops[i + 1].color, ratio);
        }
    }

    // Handle extremes
    if (anomaly < colorStops[0].threshold) return colorStops[0].color;
    return colorStops[colorStops.length - 1].color;
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
export const analyzeTemperatureAnomaly = (anomaly) => {
    if (anomaly === undefined || anomaly === null) {
        return {
            comparisonMessage: "Keine historischen Daten verfügbar.",
            anomalyMessage: null
        };
    }

    let comparisonMessage = '';

    // Determine message based on direct temperature anomaly ranges
    if (anomaly <= -10) {
        comparisonMessage = "Es ist eiskalt!";
    } else if (anomaly <= -8) {
        comparisonMessage = "Es ist sehr kalt!";
    } else if (anomaly <= -6) {
        comparisonMessage = "Es ist kalt!";
    } else if (anomaly <= -4) {
        comparisonMessage = "Es ist sehr kühl!";
    } else if (anomaly <= -2) {
        comparisonMessage = "Es ist kühl";
    } else if (anomaly < 2) {
        comparisonMessage = "Es ist ziemlich normal";
    } else if (anomaly < 4) {
        comparisonMessage = "Es ist warm";
    } else if (anomaly < 6) {
        comparisonMessage = "Es ist sehr warm!";
    } else if (anomaly < 8) {
        comparisonMessage = "Es ist heiß!";
    } else if (anomaly < 10) {
        comparisonMessage = "Es ist sehr heiß!";
    } else {
        comparisonMessage = "Es ist brütend heiß!";
    }

    const anomalyMessage = `Die aktuelle Temperatur liegt ${Math.abs(anomaly).toFixed(1)}\u00A0°C ${anomaly > 0 ? 'über' : 'unter'} dem historischen\u00A0Mittelwert.`;

    return {
        comparisonMessage,
        anomalyMessage
    };
};