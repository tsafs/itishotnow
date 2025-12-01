Implement a comprehensive loading indicator system that appears when users select a different date, tracking both data fetching and plot generation completion, with a unified minimum display duration for smooth UX, overlay-based transitions that keep previous plot visible, and centralized reusable logic.

### Steps

1. **Update loading configuration constants** in page.tsx: Remove `HEATMAP_INITIAL_DISPLAY_TIMEOUT` and replace with single `MIN_LOADING_DISPLAY_DURATION` constant (500ms) used for both initial page load and date changes, with clear documentation.

2. **Create reusable error component** in new file `components/common/LoadingError/LoadingError.tsx`: Implement `<LoadingError message={string} />` component with consistent error styling (centered, red text, appropriate padding) that can be embedded within plot-specific placeholder containers.

3. **Add global date change flag to Redux** in [`selectedDateSlice.ts`](store/slices/selectedDateSlice.ts): Add `isDateChanging: boolean` to state, set to `true` at start of `setDateAndFetchHistoricalData` thunk and `false` when data fetches complete. Export `selectIsDateChanging` selector.

4. **Create heatmap-specific data status hook** in [`store/hooks/hooks.ts`](store/hooks/hooks.ts): Add `useHeatmapDataStatus()` hook that internally uses selectors for `yearlyMeanByDayStatus`, `dailyRecentByDateStatus`, and their errors. Returns `{ isLoading: boolean, error: string | null }` representing the combined loading/error state of all data dependencies.

5. **Create generic loading orchestration hook** in new file `hooks/useDateDependentLoading.ts`: Implement `useDateDependentLoading({ dataStatusHook: () => { isLoading, error }, renderCompleteSignal: boolean, minDisplayDuration: number })` hook that enforces minimum display timing for both initial mount and date changes, waits for `renderCompleteSignal`, and returns `{ isLoading: boolean, error: string | null }` for overlay visibility control.

6. **Extend Redux state management** in [`heatmapGermanySlice.ts`](store/slices/heatmapGermanySlice.ts): Add `dateChangeRenderComplete: boolean` to state with actions `setDateChangeRenderComplete(boolean)` and `resetDateChangeRenderComplete()`. Export `selectDateChangeRenderComplete` selector. Remove `staticPlotRendered` and `setStaticPlotRendered`/`resetStaticPlotRendered` actions as they are no longer needed.

7. **Update HeatmapGermany RightSide component** in [`RightSide.tsx`](components/plots/HeatmapGermany/RightSide.tsx): Replace local loading state (`isMapLoading`, `isInitialMount`) with `useDateDependentLoading({ dataStatusHook: useHeatmapDataStatus, renderCompleteSignal: dateChangeRenderComplete, minDisplayDuration: MIN_LOADING_DISPLAY_DURATION })`. Keep `isPlotVisible` state and `plotAnimationWrapper` transition for initial fade-in on first mount. Set `isPlotVisible` to true once initial loading completes. Dispatch `setDateChangeRenderComplete(true)` when plot build completes. Dispatch `resetDateChangeRenderComplete()` when dependencies change. Update loading overlay to show shimmer dots (no error) or `<LoadingError />` (when error) as transparent overlay over existing plot, controlled by loading state from hook.

8. **Reset render flags on date change** in [`selectedDateSlice.ts`](store/slices/selectedDateSlice.ts): Dispatch `resetDateChangeRenderComplete()` for heatmap slice at the beginning of `setDateAndFetchHistoricalData` thunk to ensure loading indicator appears for new date selection.

9. **Disable date picker during loading** in [`DateSelection.tsx`](components/header/DateSelection.tsx): Subscribe to `selectIsDateChanging` and disable all date selection buttons/calendar while `true` to prevent race conditions from rapid date changes.

10. **Remove deprecated imports and usages**: Search for and remove all remaining references to `HEATMAP_INITIAL_DISPLAY_TIMEOUT`, `staticPlotRendered`, `setStaticPlotRendered`, `resetStaticPlotRendered`, and `useIsStaticPlotRendered` across the codebase including `LeftSide.tsx` and any other components.

tsafs: Start the implementation.

GitHub Copilot: Optimizing tool selection...

Read [](file:///home/sebastian/Projects/itishotnow/frontend/src/store/slices/heatmapGermanySlice.ts)

Read [](file:///home/sebastian/Projects/itishotnow/frontend/src/store/slices/selectedDateSlice.ts)