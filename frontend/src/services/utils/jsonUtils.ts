/**
 * JSON Parsing and Data Validation Utilities
 * 
 * Shared utilities for parsing JSON files and validating/transforming values.
 * Used across all data services to eliminate duplication.
 */

/**
 * Generic JSON fetcher and parser.
 * Handles the common pattern of: fetch URL → check response → parse JSON → transform data.
 * All errors are logged and re-thrown for the caller to handle.
 * 
 * @param url - URL to fetch JSON from
 * @param parser - Function that transforms JSON data into desired type
 * @param options - Optional configuration
 * @returns Parsed and transformed data
 * 
 * @example
 * interface IceAndHotData {
 *   iceDays: XYData;
 *   hotDays: XYData;
 * }
 * 
 * const data = await fetchAndParseJSON<IceAndHotData>(
 *   '/data/station_123.json',
 *   (json) => ({
 *     iceDays: XYData.fromJSON(json.daysBelow0Tmax),
 *     hotDays: XYData.fromJSON(json.daysAbove30Tmax)
 *   }),
 *   {
 *     validateKeys: ['daysBelow0Tmax', 'daysAbove30Tmax'],
 *     errorContext: 'ice and hot days'
 *   }
 * );
 */
export const fetchAndParseJSON = async <T>(
    url: string,
    parser: (data: any) => T,
    options: {
        validateKeys?: string[];
        errorContext?: string;
    } = {}
): Promise<T> => {
    const {
        validateKeys,
        errorContext = 'JSON data'
    } = options;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(
                `Failed to fetch ${errorContext}: ${response.status} ${response.statusText}`
            );
        }

        const text = await response.text();

        if (!text || text.trim().length === 0) {
            throw new Error(`No ${errorContext} found: empty response`);
        }

        // Parse JSON
        let data: any;
        try {
            data = JSON.parse(text);
        } catch (parseError) {
            throw new Error(
                `Invalid JSON format for ${errorContext}: ${parseError instanceof Error ? parseError.message : String(parseError)}`
            );
        }

        // Validate required keys if specified
        if (validateKeys && validateKeys.length > 0) {
            if (typeof data !== 'object' || data === null) {
                throw new Error(
                    `Expected ${errorContext} to be an object, got ${typeof data}`
                );
            }

            const missingKeys = validateKeys.filter(key => !(key in data));
            if (missingKeys.length > 0) {
                throw new Error(
                    `Missing required keys in ${errorContext}: ${missingKeys.join(', ')}`
                );
            }
        }

        // Transform using provided parser
        return parser(data);

    } catch (error) {
        console.error(`Error loading ${errorContext}:`, error);
        throw error;
    }
};

/**
 * Validates that a JSON object has all required keys.
 * 
 * @param obj - Object to validate
 * @param requiredKeys - Array of required key names
 * @returns True if all keys exist, false otherwise
 */
export const hasRequiredKeys = (obj: any, requiredKeys: string[]): boolean => {
    if (typeof obj !== 'object' || obj === null) {
        return false;
    }

    return requiredKeys.every(key => key in obj);
};

/**
 * Safely extracts a value from an object by key with type checking.
 * 
 * @param obj - Source object
 * @param key - Key to extract
 * @param expectedType - Expected type of the value
 * @returns The value if it exists and matches type, undefined otherwise
 */
export const safeExtract = <T>(
    obj: any,
    key: string,
    expectedType: 'string' | 'number' | 'boolean' | 'object' | 'array'
): T | undefined => {
    if (typeof obj !== 'object' || obj === null || !(key in obj)) {
        return undefined;
    }

    const value = obj[key];

    if (expectedType === 'array') {
        return Array.isArray(value) ? (value as T) : undefined;
    }

    return typeof value === expectedType ? (value as T) : undefined;
};
