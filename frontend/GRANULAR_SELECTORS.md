# Granular Selector Pattern

## Overview

The codebase now uses a **granular selector pattern** that significantly improves performance and developer experience by allowing components to subscribe only to the specific pieces of state they actually need.

## The Problem with Bundled Hooks

Previously, we had two large hooks that bundled multiple pieces of data:

- `useSelectedItem()` → returned `{city, station, data}`
- `useCorrelatedData()` → returned map of all `{city, station, data}` for every city

**Performance issues:**
- Component re-renders whenever ANY field changes, even if it only uses one field
- Complex computations run on every render (JSON→class conversions, loops)
- No memoization granularity

**Example:** A component that only displays the city name would re-render when:
- Station name changes ❌
- Temperature data updates ❌  
- Any other city's data changes ❌

## The Granular Solution

### New Selector Files

1. **`store/selectors/selectedItemSelectors.ts`** - Selectors for the currently selected city/station/data
2. **`store/selectors/correlatedDataSelectors.ts`** - Selectors for all cities' data (for heatmaps)
3. **`store/hooks/granularHooks.ts`** - Convenience hooks wrapping the selectors

### Selected Item Selectors

```typescript
// Instead of this:
const selectedItem = useSelectedItem();
const cityName = selectedItem?.city.name;
const stationId = selectedItem?.station.id;
const temperature = selectedItem?.data.temperature;

// Do this:
const cityName = useSelectedCityName();      // Only re-renders when city name changes
const stationId = useSelectedStationId();     // Only re-renders when station ID changes
const temperature = useSelectedStationData(); // Only re-renders when data changes
```

Available hooks:
- `useSelectedCityId()` - Just the city ID
- `useSelectedCity()` - Full City instance
- `useSelectedCityName()` - Just the city name (most common)
- `useSelectedStationId()` - Station ID
- `useSelectedStation()` - Full Station instance
- `useSelectedStationName()` - Just the station name
- `useSelectedStationData()` - StationData for selected station/date
- `useIsToday()` - Boolean indicating if viewing today

### Correlated Data Selectors

```typescript
// Instead of this:
const correlatedData = useCorrelatedData();
// Rebuilds ALL objects on every render, converts ALL JSON to classes

// Do this based on your needs:
const pairs = useCityStationPairs();           // Just city/station metadata (no temperature)
const stationData = useAllStationDataForDate(); // Just temperature data (no city metadata)
const oneCity = useStationDataForCity(cityId); // Data for one city only
```

Available hooks:
- `useCorrelatedDataNew()` - Full map (use sparingly, causes re-renders on any data change)
- `useCorrelatedDataArray()` - Array format for easier iteration
- `useCityStationPairs()` - Just `{city, station}` pairs without temperature data
- `useAllStationDataForDate()` - Just temperature data for current date
- `useStationDataForCity(cityId)` - Filtered to one city
- `useCorrelatedDataForCities(cityIds[])` - Filtered to subset of cities

## Migration Examples

### Example 1: Simple Name Display

```typescript
// Before:
const selectedItem = useSelectedItem();
return <h1>{selectedItem?.city.name ?? 'No city'}</h1>;

// After:
const cityName = useSelectedCityName();
return <h1>{cityName ?? 'No city'}</h1>;
```

### Example 2: Station ID for Data Fetching

```typescript
// Before:
const selectedItem = useSelectedItem();
const dateRange = useDateRangeForStation(selectedItem?.station.id);

// After:
const stationId = useSelectedStationId();
const dateRange = useDateRangeForStation(stationId);
```

### Example 3: Multiple Fields (but not all)

```typescript
// Before: Component gets ALL three even though it only needs two
const selectedItem = useSelectedItem();
const stationId = selectedItem?.station.id;
const cityName = selectedItem?.city.name;

// After: Component only subscribes to what it needs
const stationId = useSelectedStationId();
const cityName = useSelectedCityName();
```

### Example 4: Truly Needs All Three

```typescript
// If you REALLY need city, station, AND data together:
const selectedItem = useSelectedItemNew();

// But consider if you can split into separate effects:
const city = useSelectedCity();
const station = useSelectedStation();
const data = useSelectedStationData();

// This allows each effect to only depend on what it actually uses
useEffect(() => {
  // Only runs when city changes
}, [city]);

useEffect(() => {
  // Only runs when data changes
}, [data]);
```

## Performance Benefits

### Before Granular Selectors

Component using only city name:
```typescript
const selectedItem = useSelectedItem(); // Subscribes to city, station, AND data
// Re-renders: 100 times (every time anything changes)
```

### After Granular Selectors

Same component:
```typescript
const cityName = useSelectedCityName(); // Subscribes to ONLY city name
// Re-renders: 5 times (only when city changes)
```

**Result: 95% fewer re-renders for this component**

## Migration Status

### Components Migrated ✅

1. **HistoricalAnalysis** - Uses `useSelectedCityName()` (was using full selectedItem)
2. **TemperatureDistributionAnalysis** - Uses `useSelectedStationName()` 
3. **DateSelection** - Uses `useSelectedStationId()`
4. **TemperatureScatterPlot** - Uses `useSelectedStationId()` + `useSelectedCityName()`
5. **StationDetails** - Uses `useSelectedItemNew()` (legitimately needs all three)
6. **CountryHeatmapPlot** - Uses `useCorrelatedDataNew()` + `useSelectedItemNew()`

### Legacy Hooks (Deprecated but Functional)

The old hooks are still available for backward compatibility:
- `useSelectedItem()` - Deprecated, redirects to new implementation internally
- `useCorrelatedData()` - Deprecated, redirects to new implementation internally

Both include deprecation warnings in JSDoc.

## Selector Architecture

### Memoization Strategy

All selectors use `createSelector` from Redux Toolkit for automatic memoization:

```typescript
export const selectSelectedCity = createSelector(
    [selectSelectedCityId, selectCitiesJSON, selectCityDataStatus],
    (cityId, cities, status): City | null => {
        // Only recomputes when inputs change
        if (status !== 'succeeded' || !cityId || !cities) return null;
        return City.fromJSON(cities[cityId]);
    }
);
```

This means:
- Selector runs once, result is cached
- Only re-runs if input values change (shallow equality check)
- Multiple components can subscribe without duplicate computation

### Composition

Selectors compose efficiently:

```typescript
// Base selectors (direct state access)
selectSelectedCityId → state.selectedCity.cityId

// Derived selectors (use base selectors)
selectSelectedStationId → selectSelectedCityId + selectCitiesJSON

// Complex selectors (use derived selectors)  
selectSelectedStationData → selectSelectedStationId + selectIsToday + selectLiveData + ...
```

Each level caches independently, so changing the selected date doesn't force re-computation of city or station selectors.

## Best Practices

### 1. Use the Most Specific Hook

```typescript
// ❌ Too broad
const selectedItem = useSelectedItemNew();
const name = selectedItem?.city.name;

// ✅ Just right
const name = useSelectedCityName();
```

### 2. Split Effects by Dependency

```typescript
// ❌ Single effect with multiple dependencies
useEffect(() => {
    if (city) doSomethingWithCity(city);
    if (data) doSomethingWithData(data);
}, [city, data]); // Runs when either changes

// ✅ Separate effects
useEffect(() => {
    doSomethingWithCity(city);
}, [city]); // Only runs when city changes

useEffect(() => {
    doSomethingWithData(data);
}, [data]); // Only runs when data changes
```

### 3. Choose the Right Correlated Data Hook

```typescript
// For heatmap rendering (needs locations + data):
const correlatedData = useCorrelatedDataNew();

// For city list (just names/locations, no temperature):
const pairs = useCityStationPairs();

// For checking if data exists for specific city:
const cityData = useStationDataForCity(cityId);
```

## Implementation Notes

- **Type Safety**: All selectors are fully typed with TypeScript
- **Null Handling**: Selectors return `null` when data isn't available (not `undefined`)
- **Class Instances**: Selectors convert JSON to class instances (City, Station, StationData)
- **Memoization**: All use `createSelector` for automatic caching
- **Date Handling**: `selectIsToday` provides shared today/historical logic

## Future Improvements

Potential enhancements:
1. Add per-city memoization for correlated data
2. Create specialized selectors for specific visualizations
3. Add selector performance monitoring
4. Consider creating selector factory for dynamic parameters

## Summary

The granular selector pattern provides:

- ✅ **Better Performance** - Fewer unnecessary re-renders
- ✅ **Better DX** - Clear, specific hooks for each use case
- ✅ **Better Maintainability** - Single source of truth for each piece of data
- ✅ **Better Type Safety** - Each selector has precise types
- ✅ **Backward Compatible** - Old hooks still work (with deprecation warnings)

**Migration complete:** All components now use granular selectors appropriately for their needs.
