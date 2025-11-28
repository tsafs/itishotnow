/**
 * Type definitions for Redux slice factory.
 * Defines state shapes and configuration types for the generic slice creator.
 */

/**
 * Status of an async operation.
 */
export type Status = 'idle' | 'loading' | 'succeeded' | 'failed';

/**
 * Base state that all async slices share.
 */
export interface BaseState {
    status: Status;
    error: string | undefined;
}

/**
 * Simple data state - single piece of data with status.
 * Used for slices that fetch one dataset at a time.
 * 
 * @example City data, station data
 */
export interface SimpleDataState<TData> extends BaseState {
    data: TData | undefined;
}

/**
 * Keyed data state - multiple pieces of data keyed by identifier.
 * Used for slices that cache data by key (e.g., by stationId, by date).
 * 
 * @example Historical data by station, daily data by date
 */
export interface KeyedDataState<TData, TKey extends string = string> extends BaseState {
    data: Record<TKey, TData>;
    /** Tracks loading state per key */
    loadingKeys: TKey[];
}

/**
 * Data state with additional context.
 * Used for slices that need to track what was last fetched.
 * 
 * @example Yearly mean by day (tracks current month/day)
 */
export interface ContextDataState<TData, TContext> extends BaseState {
    data: TData | undefined;
    context: TContext | undefined;
}

/**
 * Cache metadata for tracking fetch times and TTL.
 */
export interface CacheMetadata {
    fetchedAt: number; // Unix timestamp in milliseconds
    key: string;
}

/**
 * State shape types available in the factory.
 */
export type StateShape = 'simple' | 'keyed' | 'with-context';

/**
 * Cache strategy types.
 */
export type CacheStrategy = 'none' | 'by-key' | 'all';

/**
 * Configuration for cache behavior.
 */
export interface CacheConfig<TArgs> {
    /** Cache strategy to use */
    strategy: CacheStrategy;

    /** For 'by-key' strategy: extract cache key from args */
    keyExtractor?: (args: TArgs) => string;

    /** Optional TTL in milliseconds (undefined = cache forever) */
    ttl?: number;
}

/**
 * Configuration for context-based state shape.
 */
export interface ContextConfig<TArgs, TContext> {
    /** Initial context value */
    initialContext: TContext | undefined;

    /** Update context based on fetch args */
    updateContext: (args: TArgs) => TContext;
}

/**
 * Selector customization options.
 */
export interface SelectorConfig<TData, TTransformed = TData> {
    /** Transform data before returning from selector */
    transformData?: (data: TData) => TTransformed;
}

/**
 * Helper type to extract the state type based on state shape.
 */
export type StateForShape<
    TShape extends StateShape,
    TData,
    TContext = never,
    TKey extends string = string
> = TShape extends 'simple'
    ? SimpleDataState<TData>
    : TShape extends 'keyed'
    ? KeyedDataState<TData, TKey>
    : TShape extends 'with-context'
    ? ContextDataState<TData, TContext>
    : never;

/**
 * Helper to check if a value is defined (not null or undefined).
 */
export const isDefined = <T>(value: T | undefined | null): value is T => {
    return value !== undefined && value !== null;
};

/**
 * Helper to get current timestamp.
 */
export const now = (): number => Date.now();

/**
 * Helper to check if cache is expired based on TTL.
 */
export const isCacheExpired = (fetchedAt: number, ttl?: number): boolean => {
    if (ttl === undefined) {
        return false; // No TTL = never expires
    }
    return now() - fetchedAt > ttl;
};
