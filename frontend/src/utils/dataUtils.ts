
/**
 * Extract hour from a date string in format "dd.mm.yyyy HH:MM" or similar
 * @param {string} dateString - The date string to extract hour from
 * @returns {number|null} The hour (0-23) or null if not found
 */
export const extractHourFromDateString = (dateString) => {
    if (!dateString) return null;

    // Try to match HH:MM pattern in the date string
    const hourMatch = dateString.match(/\s(\d{2}):/);
    if (hourMatch) {
        return parseInt(hourMatch[1], 10);
    }
    return null;
};
