/**
 * Extract the hour component from a date string containing an "HH:MM" segment.
 */
export const extractHourFromDateString = (dateString: string | null | undefined): number | null => {
    if (!dateString) return null;

    const hourMatch = dateString.match(/\s(\d{2}):/);
    if (!hourMatch) {
        return null;
    }
    const hour = Number.parseInt(hourMatch[1] ?? '', 10);
    return Number.isNaN(hour) ? null : hour;
};
