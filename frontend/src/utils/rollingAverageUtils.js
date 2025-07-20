import { getNow } from "./dateUtils";
import { DateTime } from "luxon";

/**
 * Filter temperature data to include only dates within a window around a target date
 * @param {Array} data - The full dataset
 * @param {string} targetMonthDay - The target month-day in MM-DD format
 * @param {number} windowDays - Number of days to include before and after target date
 * @param {number} fromYear - Starting year for filtering (inclusive)
 * @param {number} toYear - Ending year for filtering (inclusive)
 * @returns {Object} Filtered data separated by primary day and surrounding days
 */
export const filterTemperatureDataByDateWindow = (data, targetMonthDay, windowDays = 7, fromYear = null, toYear = null) => {
    // Calculate window dates
    const [targetMonth, targetDay] = targetMonthDay.split('-').map(Number);
    const windowDates = [];

    // Create a reference date for this year using Luxon
    const currentYear = getNow().year;
    const targetDate = DateTime.local(currentYear, targetMonth, targetDay);

    // Add days before and after using Luxon
    for (let i = -windowDays; i <= windowDays; i++) {
        const windowDate = targetDate.plus({ days: i });
        const windowMonth = String(windowDate.month).padStart(2, '0');
        const windowDay = String(windowDate.day).padStart(2, '0');
        windowDates.push(`${windowMonth}-${windowDay}`);
    }

    // Primary day data (exactly matching target date)
    const primaryDayData = [];

    // Surrounding days data (within window but not on target date)
    const surroundingDaysData = [];

    // Process each data point
    data.forEach(entry => {
        const dateParts = entry.date.split('-');
        if (dateParts.length < 3) return;

        const year = parseInt(dateParts[0], 10);
        const entryMonthDay = `${dateParts[1]}-${dateParts[2]}`;

        // Skip if outside the year range
        if ((fromYear !== null && year < fromYear) || (toYear !== null && year > toYear)) {
            return;
        }

        if (entryMonthDay === targetMonthDay) {
            // This entry is for our primary target day
            primaryDayData.push({
                ...entry,
                isPrimaryDay: true
            });
        } else if (windowDates.includes(entryMonthDay)) {
            // This entry is within our window but not the target day
            surroundingDaysData.push({
                ...entry,
                isPrimaryDay: false
            });
        }
    });

    return { primaryDayData, surroundingDaysData };
};