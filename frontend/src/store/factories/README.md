# Redux Slice Factory

This directory contains the generic slice factory for creating standardized Redux slices with minimal boilerplate.

## Overview

The slice factory eliminates 1000+ lines of repetitive Redux code by providing:

- **Configurable State Shapes**: Simple, keyed, or context-based
- **Built-in Cache Strategies**: None, by-key, or global caching with TTL support
- **Auto-generated Actions**: Async thunks with consistent error handling
- **Type-safe Selectors**: Pre-built selectors for common patterns
- **React Hooks**: Ready-to-use hooks for components
- **Validation**: Cache checking helpers

## Files

- `types.ts` - TypeScript types and interfaces
- `cacheUtils.ts` - Cache management utilities
- `createDataSlice.ts` - Main factory function
- `README.md` - This file

## Quick Start

### Simple Data Slice

For slices that fetch a single dataset (e.g., cities, stations):

```typescript
import { createDataSlice } from '../store/factories/createDataSlice';
import { fetchCities } from '../services/CityService';
import type { CityJSON } from '../classes/City';

const { slice, actions, selectors, hooks } = createDataSlice<
    Record<string, CityJSON>,  // TData
    void                        // TArgs (no arguments needed)
>({
    name: 'cities',
    fetchFn: fetchCities,
    stateShape: 'simple',
    cache: { strategy: 'all' }  // Cache forever (static data)
});

// Export for store
export default slice.reducer;

// Export actions
export const { fetch: fetchCitiesAction, reset: resetCities } = actions;

// Export selectors
export const {
    selectData: selectCities,
    selectStatus: selectCitiesStatus,
    selectIsLoading: selectCitiesIsLoading
} = selectors;

// Export hooks
export const {
    useData: useCities,
    useStatus: useCitiesStatus,
    useIsLoading: useCitiesIsLoading
} = hooks;
```

### Keyed Data Slice

For slices that cache data by identifier (e.g., historical data by station):

```typescript
import { createDataSlice } from '../store/factories/createDataSlice';
import { fetchHistoricalData } from '../services/HistoricalDataService';
import type { DailyRecentByStationJSON } from '../classes/DailyRecentByStation';

interface FetchHistoricalArgs {
    stationId: string;
}

const { slice, actions, selectors, hooks } = createDataSlice<
    Record<string, DailyRecentByStationJSON>,  // TData
    FetchHistoricalArgs                         // TArgs
>({
    name: 'historicalData',
    fetchFn: (args) => fetchHistoricalData(args.stationId),
    stateShape: 'keyed',
    cache: {
        strategy: 'by-key',
        keyExtractor: (args) => args.stationId,
        ttl: 3600000  // 1 hour TTL
    }
});

export default slice.reducer;
export const { fetch: fetchHistoricalDataAction } = actions;
```

### Context-Based Data Slice

For slices that track what was last fetched (e.g., yearly means by month/day):

```typescript
import { createDataSlice } from '../store/factories/createDataSlice';
import { fetchYearlyMeanByDay } from '../services/YearlyMeanByDayService';
import type { YearlyMeanByDayByStationId } from '../classes/YearlyMeanByDay';

interface FetchYearlyMeanArgs {
    month: number;
    day: number;
}

interface YearlyMeanContext {
    month: number;
    day: number;
}

const { slice, actions, selectors } = createDataSlice<
    YearlyMeanByDayByStationId,  // TData
    FetchYearlyMeanArgs,          // TArgs
    'with-context',               // TShape
    YearlyMeanContext             // TContext
>({
    name: 'yearlyMeanByDay',
    fetchFn: (args) => fetchYearlyMeanByDay(args.month, args.day),
    stateShape: 'with-context',
    cache: {
        strategy: 'by-key',
        keyExtractor: (args) => `${args.month}-${args.day}`,
        ttl: undefined  // Cache forever (historical data)
    },
    contextConfig: {
        initialContext: undefined,
        updateContext: (args) => ({ month: args.month, day: args.day })
    }
});

export default slice.reducer;
export const { fetch: fetchYearlyMeanByDayAction } = actions;
export const {
    selectData: selectYearlyMeanByDayData,
    selectStatus: selectYearlyMeanByDayStatus
} = selectors;
```

## Configuration Options

### `DataSliceConfig<TData, TArgs, TShape, TContext, TKey>`

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | `string` | ✅ | Slice name (used in Redux store and action types) |
| `fetchFn` | `(args: TArgs) => Promise<TData>` | ✅ | Async function to fetch data |
| `stateShape` | `'simple' \| 'keyed' \| 'with-context'` | ✅ | State structure type |
| `cache` | `CacheConfig<TArgs>` | ❌ | Cache configuration |
| `contextConfig` | `ContextConfig<TArgs, TContext>` | ⚠️ | Required if `stateShape` is `'with-context'` |
| `contextEquals` | `(a: TContext, b: TContext) => boolean` | ❌ | Custom context equality function |

### `CacheConfig<TArgs>`

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `strategy` | `'none' \| 'by-key' \| 'all'` | ✅ | Cache strategy |
| `keyExtractor` | `(args: TArgs) => string` | ⚠️ | Required if `strategy` is `'by-key'` |
| `ttl` | `number` | ❌ | Time-to-live in milliseconds (undefined = cache forever) |

### `ContextConfig<TArgs, TContext>`

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `initialContext` | `TContext \| undefined` | ✅ | Initial context value |
| `updateContext` | `(args: TArgs) => TContext` | ✅ | Function to extract context from args |

## State Shapes

### Simple State

```typescript
{
    data: TData | undefined;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | undefined;
}
```

### Keyed State

```typescript
{
    data: Record<TKey, TData>;
    loadingKeys: Set<TKey>;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | undefined;
}
```

### Context State

```typescript
{
    data: TData | undefined;
    context: TContext | undefined;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | undefined;
}
```

## Cache Strategies

### `'none'`

No caching - always fetch fresh data.

**Use for:** Real-time data that changes frequently.

### `'all'`

Cache all fetched data globally.

**Use for:** Static data (cities, stations, reference values).

### `'by-key'`

Cache data per key (extracted from args).

**Use for:** Data that varies by parameter (per-station history, per-date data).

**Requires:** `keyExtractor` function in cache config.

## Generated API

### Actions

```typescript
actions.fetch(args: TArgs) => AsyncThunk
actions.reset() => Action
```

### Selectors

```typescript
selectors.selectData(state: RootState) => TData | undefined
selectors.selectStatus(state: RootState) => Status
selectors.selectError(state: RootState) => string | undefined
selectors.selectIsLoading(state: RootState) => boolean
selectors.selectIsSucceeded(state: RootState) => boolean
selectors.selectIsFailed(state: RootState) => boolean
```

### Hooks

```typescript
hooks.useData() => TData | undefined
hooks.useStatus() => Status
hooks.useError() => string | undefined
hooks.useIsLoading() => boolean
```

### Helpers

```typescript
shouldFetch(state: RootState, args: TArgs) => boolean
```

Check if data should be fetched based on cache status.

## Usage in Components

```typescript
import { useEffect } from 'react';
import { useAppDispatch } from '../store/hooks';
import { fetchCitiesAction, useCities, useCitiesIsLoading } from '../store/slices/citiesSlice';

function CitiesComponent() {
    const dispatch = useAppDispatch();
    const cities = useCities();
    const isLoading = useCitiesIsLoading();

    useEffect(() => {
        dispatch(fetchCitiesAction());
    }, [dispatch]);

    if (isLoading) return <div>Loading...</div>;
    if (!cities) return <div>No data</div>;

    return <div>{/* Render cities */}</div>;
}
```

## Cache-Aware Dispatching

For slices with caching, check before dispatching:

```typescript
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchHistoricalDataAction, shouldFetch } from '../store/slices/historicalDataSlice';

function HistoricalDataComponent({ stationId }: { stationId: string }) {
    const dispatch = useAppDispatch();
    const state = useAppSelector(state => state);
    const args = { stationId };

    useEffect(() => {
        if (shouldFetch(state, args)) {
            dispatch(fetchHistoricalDataAction(args));
        }
    }, [stationId, dispatch, state]);

    // ...
}
```

## Migration Guide

### Before (Manual Slice)

~150 lines of boilerplate:

```typescript
// State interface
interface MyState { ... }

// Initial state
const initialState: MyState = { ... };

// Async thunk
export const fetchMyData = createAsyncThunk(...);

// Slice
const mySlice = createSlice({
    name: 'myData',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchMyData.pending, ...)
            .addCase(fetchMyData.fulfilled, ...)
            .addCase(fetchMyData.rejected, ...);
    },
});

// Selectors
export const selectMyData = (state: RootState) => ...;
export const selectMyDataStatus = (state: RootState) => ...;
// ... more selectors

// Hooks
export const useMyData = () => ...;
// ... more hooks

export default mySlice.reducer;
```

### After (Factory)

~20 lines:

```typescript
const { slice, actions, selectors, hooks } = createDataSlice({
    name: 'myData',
    fetchFn: fetchMyData,
    stateShape: 'simple',
    cache: { strategy: 'all' }
});

export default slice.reducer;
export const { fetch: fetchMyDataAction } = actions;
export const { selectData: selectMyData, useData: useMyData } = selectors;
```

**Reduction: ~87% less code**

## See Also

- [Class Patterns](../../docs/CLASS_PATTERNS.md) - Class architecture standards
- [Service Patterns](../../docs/PATTERNS.md) - Service layer patterns
- [Adding New Data Sources](../../docs/ADD_DATA_SOURCE.md) - Complete guide
- [CSV Utils](../../utils/csvUtils.ts) - CSV parsing and validation utilities
- [Service Utils](../../utils/serviceUtils.ts) - URL building and cache busting utilities

## Type Parameters

- `TData`: Type of data being fetched
- `TArgs`: Type of arguments passed to fetch function
- `TShape`: State shape (`'simple' | 'keyed' | 'with-context'`)
- `TContext`: Context type (for `'with-context'` shape)
- `TKey`: Key type for keyed data (default: `string`)
