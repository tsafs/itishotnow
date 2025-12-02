Advise me whether it makes sense to abstract out the construction of useAsyncLoadingOverlay, showing the loading indicator and error into a wrapper component. I want to make it as easy as possible with as little as possible boilerplate code to create new plots.

I could imagine that placeholder items very between plots, so keeping them configurable would be a good choice. However, error display and loading animations are probably the same for all plots. It also looks like the construction of the AsyncLoadingOptions is always very similar. As well as the use of useTemperatureAnomaliesRenderComplete or useHeatmapRenderComplete or similar functions of future plots. Functions calls like setCityChangeRenderComplete or setDateChangeRenderComplete would probably still have to be called from within the individual plot components.

loading overlay abstraction research

Searched for files matching `**/useAsyncLoadingOverlay.ts`, 1 match

Read [](file:///home/sebastian/Projects/itishotnow/frontend/src/hooks/useAsyncLoadingOverlay.ts)

Searched for text `useAsyncLoadingOverlay` (`**/frontend/**`), 7 results

Read [](file:///home/sebastian/Projects/itishotnow/frontend/src/components/plots/HeatmapGermany/RightSide.tsx)

Read [](file:///home/sebastian/Projects/itishotnow/frontend/src/components/plots/TemperatureAnomaliesByDayOverYears/LeftSide.tsx#1-1), lines 1 to 400

Read [](file:///home/sebastian/Projects/itishotnow/frontend/src/components/plots/TemperatureAnomaliesByDayOverYears/LeftSide.tsx#400-400), lines 400 to 421

Read [](file:///home/sebastian/Projects/itishotnow/frontend/src/store/hooks/hooks.ts)

Read [](file:///home/sebastian/Projects/itishotnow/frontend/src/store/slices/heatmapGermanySlice.ts)

Read [](file:///home/sebastian/Projects/itishotnow/frontend/src/store/slices/temperatureAnomaliesByDayOverYearsSlice.ts)

Searched for text `setDateChangeRenderComplete(` (`**/frontend/**`), 10 results

Read [](file:///home/sebastian/Projects/itishotnow/frontend/src/store/slices/selectedDateSlice.ts)

Searched for text `setCityChangeRenderComplete(` (`**/frontend/**`), 9 results

Read [](file:///home/sebastian/Projects/itishotnow/frontend/src/store/slices/selectedCitySlice.ts)

Searched for text `LoadingError` (`**/frontend/src/components/**`), 20 results

Read [](file:///home/sebastian/Projects/itishotnow/frontend/src/components/common/LoadingError/LoadingError.tsx)

## Plan: Loading Overlay Wrapper

Centralize the async-loading overlay into a reusable wrapper component (or hook+component pair) that consumes the existing status hooks and render-complete selectors. Expose knobs for placeholder content while defaulting to the shared shimmer/error UI, so future plots only pass their status hook, render-complete flag, and completion dispatcher, keeping per-plot side effects intact.

### Steps
1. Audit `useAsyncLoadingOverlay` usage in RightSide.tsx and LeftSide.tsx to map common props and lifecycle needs.
2. Define a wrapper component under common that accepts `statusHook`, `renderCompleteSelector`, `onRenderComplete`, and optional `placeholder`/`errorMessage`.
3. Refactor both plots to compose their plot body inside the wrapper, passing dispatch callbacks and retaining plot-specific effects (e.g., fade, idle scheduling).
4. Ensure the wrapper forwards a render prop or children function so plots can trigger `setDateChangeRenderComplete`/`setCityChangeRenderComplete` at the right moments.
5. Update styles to share shimmer/error presentation from a single stylesheet, removing duplicated inline CSS.

### Further Considerations
1. Confirm whether other plots (future ones) need multiple placeholders; Option A: single shimmer default; Option B: allow custom JSX.