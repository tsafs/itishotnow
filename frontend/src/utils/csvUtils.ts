/**
 * CSV Parsing and Data Validation Utilities
 * 
 * Shared utilities for parsing CSV files and validating/transforming values.
 * Used across all data services to eliminate duplication.
 */

/**
 * Parses a string value to a float, returning undefined for invalid values.
 * Handles empty strings, non-numeric values, and non-finite numbers.
 * 
 * @param value - String value to parse
 * @returns Parsed float or undefined if invalid
 * 
 * @example
 * parseOptionalFloat("42.5") // 42.5
 * parseOptionalFloat("") // undefined
 * parseOptionalFloat("abc") // undefined
 * parseOptionalFloat(undefined) // undefined
 */
export const parseOptionalFloat = (value: string | undefined): number | undefined => {
    if (!value || value.trim() === '') {
        return undefined;
    }

    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : undefined;
};

/**
 * Parses a string value to an integer, returning undefined for invalid values.
 * 
 * @param value - String value to parse
 * @returns Parsed integer or undefined if invalid
 */
export const parseOptionalInt = (value: string | undefined): number | undefined => {
    if (!value || value.trim() === '') {
        return undefined;
    }

    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : undefined;
};

/**
 * Replaces invalid numeric values with undefined.
 * Used to handle sentinel values like -999 that indicate missing data.
 * 
 * @param value - Numeric value to validate
 * @param invalidValues - Array of values to treat as invalid (default: [-999])
 * @returns Original value or undefined if invalid
 * 
 * @example
 * replaceInvalidWithUndefined(42.5) // 42.5
 * replaceInvalidWithUndefined(-999) // undefined
 * replaceInvalidWithUndefined(NaN) // undefined
 * replaceInvalidWithUndefined(undefined) // undefined
 */
export const replaceInvalidWithUndefined = (
    value: number | undefined,
    invalidValues: number[] = [-999]
): number | undefined => {
    if (value === undefined || Number.isNaN(value)) {
        return undefined;
    }

    if (invalidValues.includes(value)) {
        return undefined;
    }

    return value;
};

/**
 * Parses CSV text into a 2D array of string values.
 * 
 * @param text - Raw CSV text content
 * @param skipHeader - Whether to skip the first line (default: true)
 * @returns 2D array where each row is an array of column values
 * 
 * @example
 * const csv = "name,age\nAlice,30\nBob,25";
 * parseCSV(csv, true) // [["Alice", "30"], ["Bob", "25"]]
 * parseCSV(csv, false) // [["name", "age"], ["Alice", "30"], ["Bob", "25"]]
 */
export const parseCSV = (text: string, skipHeader: boolean = true): string[][] => {
    const lines = text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    const rows = lines.map(line => line.split(',').map(cell => cell.trim()));

    return skipHeader && rows.length > 0 ? rows.slice(1) : rows;
};

/**
 * Extracts CSV headers from the first line.
 * 
 * @param text - Raw CSV text content
 * @returns Array of header column names
 */
export const parseCSVHeaders = (text: string): string[] => {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    if (lines.length === 0) {
        return [];
    }

    return (lines[0] ?? '').split(',').map(column => column.trim());
};

/**
 * Generic CSV fetcher and parser.
 * Handles the common pattern of: fetch URL → check response → parse text → transform data.
 * All errors are logged and re-thrown for the caller to handle.
 * 
 * @param url - URL to fetch CSV from
 * @param parser - Function that transforms CSV rows into desired type
 * @param options - Optional configuration
 * @returns Parsed and transformed data
 * 
 * @example
 * interface City { name: string; lat: number; lon: number; }
 * 
 * const cities = await fetchAndParseCSV<City[]>(
 *   '/data/cities.csv',
 *   (rows) => rows.map(([name, lat, lon]) => ({
 *     name,
 *     lat: parseOptionalFloat(lat)!,
 *     lon: parseOptionalFloat(lon)!
 *   }))
 * );
 */
export const fetchAndParseCSV = async <T>(
    url: string,
    parser: (rows: string[][], headers?: string[]) => T,
    options: {
        skipHeader?: boolean;
        validateHeaders?: string[];
        errorContext?: string;
    } = {}
): Promise<T> => {
    const {
        skipHeader = true,
        validateHeaders,
        errorContext = 'data'
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

        // Extract and validate headers
        const headers = parseCSVHeaders(text);

        if (validateHeaders && validateHeaders.length > 0) {
            const missingHeaders = validateHeaders.filter(h => !headers.includes(h));
            if (missingHeaders.length > 0) {
                throw new Error(
                    `Missing required headers: ${missingHeaders.join(', ')}`
                );
            }
        }

        // Parse CSV rows
        const rows = parseCSV(text, skipHeader);

        if (rows.length === 0) {
            console.warn(`Warning: No data rows found in ${errorContext}`);
        }

        // Transform using provided parser
        return parser(rows, headers);

    } catch (error) {
        console.error(`Error loading ${errorContext}:`, error);
        throw error;
    }
};

/**
 * Validates that a value is a finite number within an optional range.
 * Used for lat/lon validation and other numeric bounds checking.
 * 
 * @param value - Value to validate
 * @param min - Optional minimum value (inclusive)
 * @param max - Optional maximum value (inclusive)
 * @returns True if valid, false otherwise
 */
export const isValidNumber = (
    value: number | undefined,
    min?: number,
    max?: number
): boolean => {
    if (value === undefined || !Number.isFinite(value)) {
        return false;
    }

    if (min !== undefined && value < min) {
        return false;
    }

    if (max !== undefined && value > max) {
        return false;
    }

    return true;
};

/**
 * Validates a date string in ISO format (YYYY-MM-DD).
 * 
 * @param dateStr - Date string to validate
 * @returns True if valid ISO date format
 */
export const isValidISODate = (dateStr: string | undefined): boolean => {
    if (!dateStr) {
        return false;
    }

    const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!isoDateRegex.test(dateStr)) {
        return false;
    }

    const date = new Date(dateStr);
    return !Number.isNaN(date.getTime());
};
