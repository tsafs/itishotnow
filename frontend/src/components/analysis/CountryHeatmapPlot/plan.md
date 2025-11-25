# Heatmap Data/Rendering Performance & Refactor Plan

## 1. Problem Summary

When selecting a date, the selector-backed data pipeline for the country heatmap (`selectPlotDataWithAnomalies`) sometimes runs 2–3 times before settling. While we added caching, readiness gating, contour build deduplication, and idle scheduling, the code has become harder to reason about:

- Selector complexity: Mixed responsibilities (data shaping, readiness gating, anomaly enrichment, identity caching).
- Multiple status-driven recomputations: Station data, yearly means, hourly reference data, and geojson each have their own lifecycle.
- Absent structural separation: “Base station plot points” vs “anomalies” vs “render artifacts” are not isolated.
- Caching via internal mutable properties (`_cache` / `_lastKey`) adds hidden state, obscuring purity and makes testing harder.
- Component (`View.tsx`) now handles orchestration logic (readiness, idle callback, dedup keys) that could be centralized.
- Re-renders initiated by unnecessary new object graphs: Each correlated recompute yields fresh arrays even when content unchanged.

Result: Code is harder to maintain, extend, test, and optimize further. Multiple recomputations are not catastrophic, but indicate layering issues.

## 2. Root Causes of Multiple plotData-build Executions

| Cause | Description | Impact |
|-------|-------------|--------|
| Status Cascade | Data slices resolve at different times; each success flips readiness conditions | Extra builds pre-final state |
| Coupled Selector | Single selector handles readiness + building + anomalies + caching | Increased recompute breadth |
| Identity Churn | New arrays/objects every recompute before stabilization | Effect triggers repeat |
| StrictMode (dev) | Development double invoke of effects | One extra dev-only build |
| Late Hourly/Yearly Data | “Today” or historical anomaly enrichment arrives after base station data | Second pass adds anomalies |
| GeoJSON Availability | Base plot may build before geojson completes | Early build then rebuild |
| Overloaded Responsibilities | Blurs separation → harder to gate precisely | Accidental duplicate triggers |

## 3. Refactor Objectives

1. Clarity: Each layer has a single responsibility (fetch, shape, correlate, enrich, render).
2. Performance: Minimize synchronous main-thread computation per interaction (<40ms target).
3. Reactivity Discipline: Recompute only what changed; stable references when data unchanged.
4. Composability: Enable testing of each stage (base plot data, anomaly enrichment, contour sampling).
5. Memory Efficiency: Reduce duplicate object creation and short-lived arrays.
6. Extensibility: Future additions (e.g., alternative anomaly models, smoothing, sampling, Web Worker offload).

## 4. Proposed Architecture

### Data Stages

1. Base Entities
   - Cities, Stations, StationData (already structured).
2. Correlated Station Points
   - Selector `selectCorrelatedPoints`: returns a flat array of immutable POJOs `{cityId, stationId, lat, lon, date, temperature, maxTemperature}`.
3. Anomaly Inputs
   - Separate selectors for hourly reference (`selectHourlyReferenceForDate`) and yearly mean (`selectYearlyMeanForDate`).
4. Plot Base Data
   - `selectPlotBaseData`: transforms correlated points to plot datum without anomaly.
5. Anomaly Enrichment (Pure, Optional)
   - `selectPlotAnomaliesToday` and `selectPlotAnomaliesHistorical`: produce a `Record<stationId, anomalyValue>`.
6. Final Plot Data Merge
   - `selectPlotData`: merges base + anomalies (stable identity if both unchanged).
7. Sampling (Optional Optimization)
   - `selectSampledPlotData`: down-sample stations for contour generation (grid or random stratified).
8. Render Layer
   - Component receives `plotData`, `sampledPlotData` (for contours), and lightweight `cityLabelsData`.

### Component Responsibilities

`CountryHeatmapPlot/View.tsx` after refactor:
- Subscribe only to: `sampledPlotData`, `plotData` (full for dynamic overlay), `geojson`, `selectedDate`.
- Idle-scheduled contour build using `sampledPlotData` only.
- No anomaly or base data logic; no direct status reads.
- Avoid inline style recomputation by extracting style utilities or using `useMemo` on primitive inputs only.
- Use a ref-based “buildKey” combining date + length + isToday + geojson hash to gate contour redraw.

### Hooks Refactor

Introduce simpler hooks:
- `usePlotData()` → final enriched data (stable identity)
- `useSampledPlotData()` → reduced set for heavy spatial operations
- `useGeoDomain()` → wraps geojson + projection domain readiness
- Remove `usePlotDataWithAnomalies` (legacy) and any ad-hoc logic from component.

### Selector Breakdown

| New Selector | Responsibility |
|--------------|----------------|
| `selectCorrelatedPoints` | Flat array of station-city records |
| `selectPlotBaseData` | Convert to plot base (no anomalies) |
| `selectPlotAnomaliesToday` | Compute hourly anomalies (guarded by readiness) |
| `selectPlotAnomaliesHistorical` | Compute historical anomalies |
| `selectPlotData` | Merge base + applicable anomalies with structural sharing |
| `selectSampledPlotData` | Down-sample for contouring (configurable strategy) |

### Caching Strategy

- Replace mutable `_cache` properties with a closure-level WeakMap keyed by date + mode.
- Use structural sharing: If `plotBaseData` unchanged and anomaly map unchanged, return prior `plotData` reference.
- Date/time parsing cache retained but keyed per hour/day; use fast integer extraction if format guarantees fixed pattern.

### Anomaly Calculation Optimization

- Precompute hour extraction numerically: `parsedDate.hour` replaced by substring parse if format stable (`entry.date.slice(11,13)`).
- For historical mode, reference lookup optimized via direct object access without repeated optional chaining inside loops.

### Contour Performance

- Use `sampledPlotData` (e.g. ≤250 points) as contour input; keep full set for dots/labels.
- Optional: Apply hexagonal binning or grid interpolation to stabilize contour complexity O(n) rather than O(n log n).
- Future optional worker: Offload contour generation into Web Worker, returning SVG path or raster.

## 5. Refactor Implementation Plan

1. Introduce new selectors file: `heatmapSelectors.ts` (keep old file temporarily).
2. Move and adapt existing logic into decomposed selectors (phased replacement).
3. Implement sampling strategy: start with simple uniform skip (e.g., take every Nth station), then upgrade to spatial stratified sampling.
4. Replace component data dependencies to use new selectors/hooks.
5. Remove legacy `selectPlotDataWithAnomalies` and in-component gating after verification.
6. Add performance instrumentation (dev only) around:
   - `selectPlotBaseData`
   - anomaly selectors
   - contour build
7. Validate stability: Confirm single build per date change (except StrictMode double-mount).
8. Remove instrumentation & legacy code paths.
9. Document new architecture (`frontend/docs/HEATMAP_DATA_FLOW.md`).

## 6. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Regression in anomaly accuracy | Snapshot test comparing old vs new arrays for several dates |
| Increased initial complexity | Keep staged refactor; remove legacy only after parity confirmed |
| Over-sampling loses visual fidelity | Allow tuning sample size via config constant |
| Selector churn persists | Use shared caches + shallow equality; ensure minimal dependency arrays |
| Worker offload complexity | Defer until after structural simplification verified |

## 7. Success Criteria

- Single `plotData-build` per date change (post readiness).
- Click handler main-thread time < 50ms.
- Contour build time reduced proportionally to sampling (target < 30ms).
- Memory footprint stable (no continuous StationData growth).
- Code readability improved (each selector ≤ 40–50 LOC, clearly named).
- Easy extension: adding new anomaly type requires only a new anomaly selector.

## 8. Future Enhancements (Optional)

- Web Worker contour generation.
- Persistent caching keyed by date in sessionStorage (for back/forward navigation).
- Progressive enhancement: show intermediate “loading” visual while anomalies compute.
- Incremental hydration: render base plot first, overlay anomalies after they arrive.

## 9. Immediate Next Steps

1. Create `heatmapSelectors.ts` with stage 1: `selectCorrelatedPoints`, `selectPlotBaseData`.
2. Wire component to new base selectors, keep anomalies from old path for temporary comparison.
3. Add anomaly selectors & merge.
4. Integrate sampling + update View to use sampled data for contours.
5. Remove old selector + inline logic.
6. Write short doc & finalize.

---

Let me know if you’d like me to start with step 1 (new selectors file) now.