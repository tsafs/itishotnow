/**
 * Service Utilities
 * 
 * Shared utilities for data services including URL construction,
 * cache busting, and error handling.
 */

import { DateTime } from 'luxon';

/**
 * Generates a cache-busting query parameter based on current timestamp.
 * Used for data that updates frequently (e.g., live/recent data).
 * 
 * @param format - Luxon format string for timestamp (default: 'yyyyLLddHH')
 * @returns Cache-busting string value
 * 
 * @example
 * getCacheBuster() // "2025112114"
 * getCacheBuster('yyyyLLdd') // "20251121"
 */
export const getCacheBuster = (format: string = 'yyyyLLddHH'): string => {
    return DateTime.now().toFormat(format);
};

/**
 * Adds cache busting to a URL.
 * Gives developers full control over the path while standardizing cache busting.
 * 
 * @param url - Full URL path (e.g., '/data/station/12345.csv' or '/german_cities.csv')
 * @param cacheBust - Whether to append cache-busting parameter
 * @param cacheBustFormat - Optional timestamp format for cache busting
 * @returns URL with optional cache parameter
 * 
 * @example
 * buildUrl('/data/station/12345.csv', false) 
 * // "/data/station/12345.csv"
 * 
 * buildUrl('/data/station/12345.csv', true)
 * // "/data/station/12345.csv?t=2025112114"
 * 
 * buildUrl('/german_cities.csv', true, 'yyyyLLddHHmm')
 * // "/german_cities.csv?t=202511211430"
 */
export const buildUrl = (
    url: string,
    cacheBust: boolean = false,
    cacheBustFormat?: string
): string => {
    if (cacheBust) {
        const timestamp = getCacheBuster(cacheBustFormat);
        return `${url}?t=${timestamp}`;
    }

    return url;
};

/**
 * Creates a standardized error with context information.
 * Helps with debugging by including relevant context in error messages.
 * 
 * @param message - Error message
 * @param context - Additional context (e.g., stationId, date range)
 * @returns Error with formatted message
 * 
 * @example
 * throw createServiceError(
 *   'Failed to fetch station data',
 *   { stationId: '12345', dateRange: '2020-2025' }
 * );
 * // Error: Failed to fetch station data (stationId: 12345, dateRange: 2020-2025)
 */
export const createServiceError = (
    message: string,
    context?: Record<string, any>
): Error => {
    if (!context || Object.keys(context).length === 0) {
        return new Error(message);
    }

    const contextStr = Object.entries(context)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');

    return new Error(`${message} (${contextStr})`);
};

/**
 * Helper to determine if a date-based resource should be cache-busted.
 * 
 * @param date - Date of the data
 * @param includeToday - Whether today's data should be cache-busted
 * @returns True if cache busting recommended
 */
export const shouldCacheBustDate = (date: string, includeToday: boolean = true): boolean => {
    const dataDate = DateTime.fromISO(date);
    const today = DateTime.now().startOf('day');

    if (!dataDate.isValid) {
        console.warn(`Invalid date for cache bust check: ${date}`);
        return false;
    }

    // Historical data (past dates) - never cache bust
    if (dataDate < today) {
        return false;
    }

    // Today's data - cache bust if includeToday is true
    if (dataDate.equals(today)) {
        return includeToday;
    }

    // Future dates - cache bust
    return true;
};
