# Country Heatmap Data Flow (Refactored)

## Overview
The heatmap rendering pipeline has been decomposed into narrowly focused selectors to improve clarity, testability, and performance. Previously a single selector (`selectPlotDataWithAnomalies`) handled readiness gating, data shaping, anomaly enrichment, and caching. The new architecture separates these concerns and introduces structural sharing plus sampling for heavy contour operations.

## Selector Stages
1. Correlated Points (`selectCorrelatedPoints`)
   - Produces immutable flat records combining city + station + minimal station data.
   - Handles live vs historical station data resolution.
2. Plot Base Data (`selectPlotBaseData`)
   - Converts correlated points into `PlotBaseDatum` choosing display temperature (live mean vs historical max).
   - Adds raw fields for later anomaly computation; anomaly left null.
3. Anomalies
   - Today: `selectPlotAnomaliesToday` compares live temperature to hourly reference (hour_x lookup).
   - Historical: `selectPlotAnomaliesHistorical` compares max temperature to yearly mean tasmax.
4. Final Merge (`selectPlotData`)
   - Merges base + anomalies with structural sharing (returns previous array if both inputs unchanged).
5. Sampling (`selectSampledPlotData`)
   - Reduces dataset size for contour generation (target ≤250 points) while keeping full set for dots/labels.

## Caching & Structural Sharing
Each selector uses closure-held `_cache` and `_lastKey` (or refs to previous input arrays) instead of mutable fields on exported functions. Reuse of prior references prevents unnecessary React re-renders and expensive recomputation when inputs are unchanged or not yet fully ready.

Key strategies:
- Early return of previous cache while readiness conditions (hourly/yearly data) are incomplete.
- Identity preservation when anomaly map unchanged.
- Lightweight deterministic keys (mode + length + status) for base/anomaly caches.

## Readiness Gating
Readiness is enforced at anomaly selectors; incomplete hourly or yearly data yields previous cached anomaly map. `selectPlotData` then merges base with either the anomaly map (ready) or null anomalies (stable identity if base unchanged).

## Component Responsibilities (`View.tsx`)
- Subscribes to `plotData` and `sampledPlotData` (legacy selector still present for parity validation).
- Uses `sampledPlotData` only for contours; full `plotData` for labels and interaction.
- Idle scheduling retained for contour build to minimize main-thread impact.
- Development-only parity instrumentation compares legacy vs new output.

## Performance Benefits
- Reduced synchronous work per date change by isolating anomaly logic.
- Sampling cuts contour input size, improving build time for large station sets.
- Structural sharing prevents redundant React effect triggers.

## Migration Steps
1. Validate parity logs show zero mismatches for anomaly values across representative dates.
2. Remove legacy selector hook (`usePlotDataWithAnomalies`) from component and codebase.
3. Remove comparison instrumentation (dev-only effect) once confident.
4. Optionally introduce Web Worker for contour generation using `sampledPlotData`.

## Testing Suggestions
- Snapshot test `selectPlotData` vs legacy output for a fixed seed dataset.
- Benchmark contour build time before/after sampling.
- Verify single plot data recompute per date change (excluding StrictMode double invoke).

## Extension Points
- Alternative anomaly models: add new anomaly selector and adjust merge to incorporate another value (e.g., humidity anomaly).
- Spatial sampling strategies: replace simple step sampling with stratified or grid-based approach for better spatial uniformity.
- Persistent session cache: store finalized plot arrays keyed by date in `sessionStorage` for back/forward navigation.

## Glossary
- Correlated Point: Basic joined city/station + minimal station data.
- Plot Base Datum: Render-ready point without anomalies.
- Anomaly Map: StationId → anomaly value record.
- Structural Sharing: Reusing previous object/array reference to prevent downstream updates.

## Removal Checklist (Legacy Code)
- Delete `selectPlotDataWithAnomalies` after parity confirmed.
- Remove `usePlotDataWithAnomalies` hook and its imports.
- Clean up any dev timing labels no longer needed.

---
If additional clarification is needed or you plan to extend anomalies, update this file to reflect new selectors and readiness conditions.
