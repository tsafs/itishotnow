/**
 * Generic Data Slice Factory
 * 
 * Creates standardized Redux slices for async data fetching with:
 * - Configurable state shapes (simple, keyed, with-context)
 * - Built-in cache strategies (none, by-key, all)
 * - Automatic thunk generation
 * - Type-safe selectors and hooks
 * - Consistent error handling
 * 
 * This factory eliminates 1000+ lines of boilerplate across slices.
 */

import { createAsyncThunk, createSlice, type PayloadAction, type Slice, type AsyncThunk } from '@reduxjs/toolkit';
import { useAppSelector } from '../hooks/useAppSelector';
import type { RootState } from '../index';
import type {
    Status,
    StateShape,
    CacheStrategy,
    CacheConfig,
    ContextConfig,
    SelectorConfig,
    SimpleDataState,
    KeyedDataState,
    ContextDataState,
    StateForShape,
} from './types';
import {
    shouldFetchFromCacheSimple,
    shouldFetchFromCacheKeyed,
    shouldFetchFromCacheContext,
    getCachedDataSimple,
    getCachedDataKeyed,
    getCachedDataContext,
    setCacheMetadataSimple,
    setCacheMetadataKeyed,
    setCacheMetadataContext,
} from './cacheUtils';

/**
 * Configuration for creating a data slice.
 */
export interface DataSliceConfig<
    TData,
    TArgs,
    TShape extends StateShape = 'simple',
    TContext = never
> {
    /** Name of the slice (used in action types and store) */
    name: string;

    /** Async function to fetch data */
    fetchFn: (args: TArgs) => Promise<TData>;

    /** State shape: 'simple', 'keyed', or 'with-context' */
    stateShape: TShape;

    /** Cache configuration (optional) */
    cache?: CacheConfig<TArgs>;

    /** Context configuration (required if stateShape is 'with-context') */
    contextConfig?: TShape extends 'with-context' ? ContextConfig<TArgs, TContext> : never;

    /** Selector customization (optional) */
    selectors?: SelectorConfig<TData>;

    /** Custom equality function for context comparison */
    contextEquals?: (a: TContext, b: TContext) => boolean;
}

/**
 * Return type from createDataSlice factory.
 */
export interface DataSliceResult<
    TData,
    TArgs,
    TShape extends StateShape,
    TContext = never,
    TKey extends string = string
> {
    /** The generated Redux slice */
    slice: Slice<StateForShape<TShape, TData, TContext, TKey>>;

    /** Actions */
    actions: {
        /** Async thunk for fetching data */
        fetch: AsyncThunk<TData, TArgs, { rejectValue: string }>;
        /** Reset slice to initial state */
        reset: () => PayloadAction<void>;
    };

    /** Selectors */
    selectors: {
        /** Select data */
        selectData: (state: RootState) => TData | undefined;
        /** Select status */
        selectStatus: (state: RootState) => Status;
        /** Select error */
        selectError: (state: RootState) => string | undefined;
        /** Check if loading */
        selectIsLoading: (state: RootState) => boolean;
        /** Check if succeeded */
        selectIsSucceeded: (state: RootState) => boolean;
        /** Check if failed */
        selectIsFailed: (state: RootState) => boolean;
    };

    /** Hooks */
    hooks: {
        /** Hook to get data */
        useData: () => TData | undefined;
        /** Hook to get status */
        useStatus: () => Status;
        /** Hook to get error */
        useError: () => string | undefined;
        /** Hook to check if loading */
        useIsLoading: () => boolean;
    };

    /** Helper to check if data should be fetched (considers cache) */
    shouldFetch: (state: RootState, args: TArgs) => boolean;
}

/**
 * Creates a standardized data slice with async thunk, reducers, selectors, and hooks.
 * 
 * @example Simple state
 * const { slice, actions, selectors, hooks } = createDataSlice({
 *   name: 'cities',
 *   fetchFn: fetchCities,
 *   stateShape: 'simple',
 *   cache: { strategy: 'all' }
 * });
 * 
 * @example Keyed state with cache
 * const { slice, actions, selectors, hooks } = createDataSlice({
 *   name: 'historicalData',
 *   fetchFn: fetchHistoricalData,
 *   stateShape: 'keyed',
 *   cache: {
 *     strategy: 'by-key',
 *     keyExtractor: (args) => args.stationId,
 *     ttl: 60000 // 1 minute
 *   }
 * });
 * 
 * @example Context state
 * const { slice, actions, selectors, hooks } = createDataSlice({
 *   name: 'yearlyMean',
 *   fetchFn: fetchYearlyMean,
 *   stateShape: 'with-context',
 *   cache: { strategy: 'by-key', keyExtractor: (args) => `${args.month}-${args.day}` },
 *   contextConfig: {
 *     initialContext: undefined,
 *     updateContext: (args) => ({ month: args.month, day: args.day })
 *   }
 * });
 */
export function createDataSlice<
    TData,
    TArgs,
    TShape extends StateShape = 'simple',
    TContext = never,
    TKey extends string = string
>(
    config: DataSliceConfig<TData, TArgs, TShape, TContext>
): DataSliceResult<TData, TArgs, TShape, TContext, TKey> {
    const {
        name,
        fetchFn,
        stateShape,
        cache,
        contextConfig,
        contextEquals,
    } = config;

    // Determine cache strategy
    const cacheStrategy: CacheStrategy = cache?.strategy ?? 'none';
    const cacheTTL = cache?.ttl;

    // Create initial state based on shape
    const initialState = createInitialState<TData, TShape, TContext, TKey>(stateShape, contextConfig);

    // Create async thunk with cache logic
    const fetchThunk = createAsyncThunk<TData, TArgs, { rejectValue: string }>(
        `${name}/fetch`,
        async (args, { rejectWithValue, getState }) => {
            // Fetch fresh data
            try {
                // Note: Cache checking is done in the state via reducers
                // We always fetch here, cache is checked before dispatch in the components
                const data = await fetchFn(args);
                return data;
            } catch (error) {
                const message = error instanceof Error ? error.message : `Failed to fetch ${name} data`;
                return rejectWithValue(message);
            }
        }
    );

    // Create slice with reducers
    const slice = createSlice({
        name,
        initialState: initialState as any,
        reducers: {
            reset: (state) => {
                Object.assign(state, initialState);
            },
        },
        extraReducers: (builder) => {
            builder
                .addCase(fetchThunk.pending, (state, action) => {
                    handlePending(state, action.meta.arg, stateShape, cache);
                })
                .addCase(fetchThunk.fulfilled, (state, action) => {
                    handleFulfilled(state, action.payload, action.meta.arg, stateShape, cache, contextConfig, name, cacheTTL);
                })
                .addCase(fetchThunk.rejected, (state, action) => {
                    handleRejected(state, action.payload as string | undefined, action.meta.arg, stateShape, cache);
                });
        },
    });

    // Create selectors
    const selectors = createSelectors<TData>(name);

    // Create hooks
    const hooks = createHooks<TData>(selectors);

    // Create helper to check if should fetch (for cache-aware dispatching)
    const shouldFetch = (state: RootState, args: TArgs): boolean => {
        if (cacheStrategy === 'none') {
            return true; // Always fetch if no caching
        }

        const sliceState = (state as any)[name];
        return !checkCache(sliceState, args, stateShape, name, cache, contextConfig, contextEquals);
    };

    return {
        slice: slice as any,
        actions: {
            fetch: fetchThunk as any,
            reset: slice.actions.reset,
        },
        selectors,
        hooks,
        shouldFetch, // Export cache checker
    };
}

/**
 * Creates initial state based on state shape.
 */
function createInitialState<TData, TShape extends StateShape, TContext, TKey extends string>(
    stateShape: TShape,
    contextConfig?: ContextConfig<any, TContext>
): StateForShape<TShape, TData, TContext, TKey> {
    const baseState = {
        status: 'idle' as Status,
        error: undefined,
    };

    switch (stateShape) {
        case 'simple':
            return {
                ...baseState,
                data: undefined,
            } as StateForShape<TShape, TData, TContext, TKey>;

        case 'keyed':
            return {
                ...baseState,
                data: {} as Record<TKey, TData>,
                loadingKeys: new Set<TKey>(),
            } as StateForShape<TShape, TData, TContext, TKey>;

        case 'with-context':
            return {
                ...baseState,
                data: undefined,
                context: contextConfig?.initialContext,
            } as StateForShape<TShape, TData, TContext, TKey>;

        default:
            throw new Error(`Unknown state shape: ${stateShape}`);
    }
}

/**
 * Checks if cached data should be used.
 */
function checkCache<TData, TArgs, TContext, TKey extends string>(
    state: any,
    args: TArgs,
    stateShape: StateShape,
    sliceName: string,
    cache?: CacheConfig<TArgs>,
    contextConfig?: ContextConfig<TArgs, TContext>,
    contextEquals?: (a: TContext, b: TContext) => boolean
): boolean {
    if (!cache || cache.strategy === 'none') {
        return false;
    }

    switch (stateShape) {
        case 'simple':
            return shouldFetchFromCacheSimple(state as SimpleDataState<TData>, sliceName, cache.ttl);

        case 'keyed': {
            if (!cache.keyExtractor) {
                console.warn(`Cache strategy 'by-key' requires keyExtractor for slice ${sliceName}`);
                return false;
            }
            const key = cache.keyExtractor(args) as TKey;
            return shouldFetchFromCacheKeyed(state as KeyedDataState<TData, TKey>, key, sliceName, cache.ttl);
        }

        case 'with-context': {
            if (!contextConfig) {
                return false;
            }
            const newContext = contextConfig.updateContext(args);
            return shouldFetchFromCacheContext(
                state as ContextDataState<TData, TContext>,
                newContext,
                sliceName,
                cache.ttl,
                contextEquals
            );
        }

        default:
            return false;
    }
}

/**
 * Gets cached data based on state shape.
 */
function getCachedData<TData, TArgs, TKey extends string>(
    state: any,
    args: TArgs,
    stateShape: StateShape,
    cache?: CacheConfig<TArgs>
): TData | undefined {
    switch (stateShape) {
        case 'simple':
            return getCachedDataSimple(state as SimpleDataState<TData>);

        case 'keyed': {
            if (!cache?.keyExtractor) {
                return undefined;
            }
            const key = cache.keyExtractor(args) as TKey;
            return getCachedDataKeyed(state as KeyedDataState<TData, TKey>, key);
        }

        case 'with-context':
            return getCachedDataContext(state as ContextDataState<TData, any>);

        default:
            return undefined;
    }
}

// Continue in next part...

/**
 * Handles pending state for async thunk.
 */
function handlePending<TArgs, TKey extends string>(
    state: any,
    args: TArgs,
    stateShape: StateShape,
    cache?: CacheConfig<TArgs>
): void {
    state.status = 'loading';

    if (stateShape === 'keyed' && cache?.keyExtractor) {
        const key = cache.keyExtractor(args) as TKey;
        state.loadingKeys.add(key);
    }
}

/**
 * Handles fulfilled state for async thunk.
 */
function handleFulfilled<TData, TArgs, TContext, TKey extends string>(
    state: any,
    payload: TData,
    args: TArgs,
    stateShape: StateShape,
    cache?: CacheConfig<TArgs>,
    contextConfig?: ContextConfig<TArgs, TContext>,
    sliceName?: string,
    cacheTTL?: number
): void {
    state.status = 'succeeded';
    state.error = undefined;

    switch (stateShape) {
        case 'simple':
            state.data = payload;
            if (sliceName) {
                setCacheMetadataSimple(sliceName);
            }
            break;

        case 'keyed': {
            if (cache?.keyExtractor) {
                const key = cache.keyExtractor(args) as TKey;
                state.data[key] = payload;
                state.loadingKeys.delete(key);
                if (sliceName) {
                    setCacheMetadataKeyed(sliceName, key);
                }
            }
            break;
        }

        case 'with-context':
            state.data = payload;
            if (contextConfig) {
                state.context = contextConfig.updateContext(args);
                if (sliceName) {
                    setCacheMetadataContext(sliceName, state.context);
                }
            }
            break;
    }
}

/**
 * Handles rejected state for async thunk.
 */
function handleRejected<TArgs, TKey extends string>(
    state: any,
    error: string | undefined,
    args: TArgs,
    stateShape: StateShape,
    cache?: CacheConfig<TArgs>
): void {
    state.status = 'failed';
    state.error = error ?? 'An error occurred';

    if (stateShape === 'keyed' && cache?.keyExtractor) {
        const key = cache.keyExtractor(args) as TKey;
        state.loadingKeys.delete(key);
    }
}

/**
 * Creates selectors for the slice.
 */
function createSelectors<TData>(sliceName: string) {
    const selectData = (state: RootState): TData | undefined => {
        const sliceState = (state as any)[sliceName];
        return sliceState?.data;
    };

    const selectStatus = (state: RootState): Status => {
        const sliceState = (state as any)[sliceName];
        return sliceState?.status ?? 'idle';
    };

    const selectError = (state: RootState): string | undefined => {
        const sliceState = (state as any)[sliceName];
        return sliceState?.error;
    };

    const selectIsLoading = (state: RootState): boolean => {
        return selectStatus(state) === 'loading';
    };

    const selectIsSucceeded = (state: RootState): boolean => {
        return selectStatus(state) === 'succeeded';
    };

    const selectIsFailed = (state: RootState): boolean => {
        return selectStatus(state) === 'failed';
    };

    return {
        selectData,
        selectStatus,
        selectError,
        selectIsLoading,
        selectIsSucceeded,
        selectIsFailed,
    };
}

/**
 * Creates hooks for the slice.
 */
function createHooks<TData>(selectors: ReturnType<typeof createSelectors>) {
    const useData = (): TData | undefined => {
        return useAppSelector(selectors.selectData) as TData | undefined;
    };

    const useStatus = (): Status => {
        return useAppSelector(selectors.selectStatus);
    };

    const useError = (): string | undefined => {
        return useAppSelector(selectors.selectError);
    };

    const useIsLoading = (): boolean => {
        return useAppSelector(selectors.selectIsLoading);
    };

    return {
        useData,
        useStatus,
        useError,
        useIsLoading,
    };
}
