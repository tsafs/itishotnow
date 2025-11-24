/**
 * Cache utilities for Redux slices.
 * Handles cache checking, metadata tracking, and TTL validation.
 */

import type { CacheMetadata, KeyedDataState, SimpleDataState, ContextDataState } from './types';
import { now, isCacheExpired } from './types';

/**
 * Cache metadata storage keyed by slice name + cache key.
 */
const cacheMetadataStore = new Map<string, CacheMetadata>();

/**
 * Generates a unique cache metadata key.
 */
const getCacheMetadataKey = (sliceName: string, dataKey?: string): string => {
    return dataKey ? `${sliceName}:${dataKey}` : sliceName;
};

/**
 * Checks if data should be fetched from cache for a simple state.
 * 
 * @param state - Current slice state
 * @param sliceName - Name of the slice (for metadata tracking)
 * @param ttl - Optional TTL in milliseconds
 * @returns True if cached data is valid and should be used
 */
export const shouldFetchFromCacheSimple = <TData>(
    state: SimpleDataState<TData>,
    sliceName: string,
    ttl?: number
): boolean => {
    // No data cached
    if (state.data === undefined) {
        return false;
    }

    // Currently loading
    if (state.status === 'loading') {
        return true; // Don't re-fetch while loading
    }

    // Check TTL if configured
    if (ttl !== undefined) {
        const metadataKey = getCacheMetadataKey(sliceName);
        const metadata = cacheMetadataStore.get(metadataKey);

        if (!metadata || isCacheExpired(metadata.fetchedAt, ttl)) {
            return false; // Cache expired
        }
    }

    return true; // Valid cache
};

/**
 * Checks if data should be fetched from cache for a keyed state.
 * 
 * @param state - Current slice state
 * @param key - Data key to check
 * @param sliceName - Name of the slice (for metadata tracking)
 * @param ttl - Optional TTL in milliseconds
 * @returns True if cached data is valid and should be used
 */
export const shouldFetchFromCacheKeyed = <TData, TKey extends string = string>(
    state: KeyedDataState<TData, TKey>,
    key: TKey,
    sliceName: string,
    ttl?: number
): boolean => {
    // No data cached for this key
    if (!(key in state.data)) {
        return false;
    }

    // Currently loading this key
    if (state.loadingKeys.includes(key)) {
        return true; // Don't re-fetch while loading
    }

    // Check TTL if configured
    if (ttl !== undefined) {
        const metadataKey = getCacheMetadataKey(sliceName, key);
        const metadata = cacheMetadataStore.get(metadataKey);

        if (!metadata || isCacheExpired(metadata.fetchedAt, ttl)) {
            return false; // Cache expired
        }
    }

    return true; // Valid cache
};

/**
 * Checks if data should be fetched from cache for a context state.
 * 
 * @param state - Current slice state
 * @param newContext - New context to compare against
 * @param sliceName - Name of the slice (for metadata tracking)
 * @param ttl - Optional TTL in milliseconds
 * @returns True if cached data is valid and should be used
 */
export const shouldFetchFromCacheContext = <TData, TContext>(
    state: ContextDataState<TData, TContext>,
    newContext: TContext,
    sliceName: string,
    ttl?: number,
    contextEquals?: (a: TContext, b: TContext) => boolean
): boolean => {
    // No data cached
    if (state.data === undefined || state.context === undefined) {
        return false;
    }

    // Currently loading
    if (state.status === 'loading') {
        return true; // Don't re-fetch while loading
    }

    // Check if context matches (use custom equality if provided)
    const contextsMatch = contextEquals
        ? contextEquals(state.context, newContext)
        : JSON.stringify(state.context) === JSON.stringify(newContext);

    if (!contextsMatch) {
        return false; // Different context = need fresh data
    }

    // Check TTL if configured
    if (ttl !== undefined) {
        const contextKey = JSON.stringify(newContext);
        const metadataKey = getCacheMetadataKey(sliceName, contextKey);
        const metadata = cacheMetadataStore.get(metadataKey);

        if (!metadata || isCacheExpired(metadata.fetchedAt, ttl)) {
            return false; // Cache expired
        }
    }

    return true; // Valid cache
};

/**
 * Gets cached data from simple state.
 */
export const getCachedDataSimple = <TData>(
    state: SimpleDataState<TData>
): TData | undefined => {
    return state.data;
};

/**
 * Gets cached data from keyed state.
 */
export const getCachedDataKeyed = <TData, TKey extends string = string>(
    state: KeyedDataState<TData, TKey>,
    key: TKey
): TData | undefined => {
    return state.data[key];
};

/**
 * Gets cached data from context state.
 */
export const getCachedDataContext = <TData, TContext>(
    state: ContextDataState<TData, TContext>
): TData | undefined => {
    return state.data;
};

/**
 * Sets cache metadata for simple state.
 */
export const setCacheMetadataSimple = (sliceName: string): void => {
    const metadataKey = getCacheMetadataKey(sliceName);
    cacheMetadataStore.set(metadataKey, {
        fetchedAt: now(),
        key: sliceName,
    });
};

/**
 * Sets cache metadata for keyed state.
 */
export const setCacheMetadataKeyed = (sliceName: string, dataKey: string): void => {
    const metadataKey = getCacheMetadataKey(sliceName, dataKey);
    cacheMetadataStore.set(metadataKey, {
        fetchedAt: now(),
        key: dataKey,
    });
};

/**
 * Sets cache metadata for context state.
 */
export const setCacheMetadataContext = <TContext>(
    sliceName: string,
    context: TContext
): void => {
    const contextKey = JSON.stringify(context);
    const metadataKey = getCacheMetadataKey(sliceName, contextKey);
    cacheMetadataStore.set(metadataKey, {
        fetchedAt: now(),
        key: contextKey,
    });
};

/**
 * Clears all cache metadata for a slice.
 */
export const clearCacheMetadata = (sliceName: string): void => {
    const keysToDelete: string[] = [];

    for (const key of cacheMetadataStore.keys()) {
        if (key.startsWith(`${sliceName}:`)) {
            keysToDelete.push(key);
        }
    }

    for (const key of keysToDelete) {
        cacheMetadataStore.delete(key);
    }
};

/**
 * Clears specific cache metadata entry.
 */
export const clearCacheMetadataKey = (sliceName: string, dataKey?: string): void => {
    const metadataKey = getCacheMetadataKey(sliceName, dataKey);
    cacheMetadataStore.delete(metadataKey);
};

/**
 * Gets all cache metadata for debugging.
 */
export const getAllCacheMetadata = (): Map<string, CacheMetadata> => {
    return new Map(cacheMetadataStore);
};
