import { useEffect, useRef, useMemo, memo } from 'react';
import type { CSSProperties } from 'react';
import { theme } from '../../../styles/design-system.js';
import { useBreakpoint, useBreakpointDown } from '../../../hooks/useBreakpoint.js';
import { useAppDispatch } from '../../../store/hooks/useAppDispatch.js';
import { useSelectedCityName } from '../../../store/hooks/hooks.js';
import { MIN_LOADING_DISPLAY_DURATION } from '../../../constants/page.js';
import AsyncLoadingOverlayWrapper from '../../common/AsyncLoadingOverlayWrapper/AsyncLoadingOverlayWrapper.js';
import createPlot from './plot.js';
import { usePlotData } from './hooks/usePlotData.js';
import { setRenderComplete, useRenderComplete } from './slices/slice.js';
import { useDataStatus } from './hooks/useDataStatus.js';
import { applyPlotStyles, getPlotStyleRules } from '../utils/plotStyles.js';
import type { StackedPlotViewBottomProps } from '../../common/PlotView/StackedPlotView.js';

const getPlotContainerStyle = (dims: { width: number; height: number }): CSSProperties => ({
    position: 'relative',
    maxWidth: dims.width,
    maxHeight: dims.height,
});

const getPlotStyle = (isDarkTheme: boolean): CSSProperties => ({
    color: isDarkTheme ? theme.colors.plotDark.text : theme.colors.plotLight.text,
});

const MonthlyTemperatureAnomaliesBottom = memo(({ darkMode = false }: StackedPlotViewBottomProps) => {
    const dispatch = useAppDispatch();
    const breakpoint = useBreakpoint();
    const isMobile = useBreakpointDown('mobile');
    const selectedCityName = useSelectedCityName();
    const data = usePlotData();
    const renderComplete = useRenderComplete();
    const containerRef = useRef<HTMLDivElement | null>(null);

    const MAP_DIMENSIONS: Record<'mobile' | 'tablet' | 'desktop' | 'wide', { width: number; height: number }> = {
        mobile: { width: 480, height: 240 },
        tablet: { width: 768, height: 384 },
        desktop: { width: 800, height: 400 },
        wide: { width: 1000, height: 500 }
    };
    const FONT_SIZES: Record<'mobile' | 'tablet' | 'desktop' | 'wide', number> = {
        mobile: 10,
        tablet: 12,
        desktop: 12,
        wide: 12
    };
    const plotDims = MAP_DIMENSIONS[breakpoint];
    const fontSize = FONT_SIZES[breakpoint];

    useEffect(() => {
        // Reset render state when city changes to ensure overlay behaves correctly
        dispatch(setRenderComplete(false));
        if (!selectedCityName || !containerRef.current) return;
        try {
            const nextPlot = createPlot(data, plotDims, darkMode);
            containerRef.current.replaceChildren(nextPlot);
            applyPlotStyles(nextPlot, getPlotStyleRules(isMobile, fontSize, darkMode));
            dispatch(setRenderComplete(true));
        } catch (err) {
            console.error('Error creating anomalies plot:', err);
            dispatch(setRenderComplete(true));
        }
    }, [selectedCityName, data, dispatch, plotDims, fontSize, isMobile, darkMode]);

    useEffect(() => () => { containerRef.current = null; }, []);

    useEffect(() => {
        if (data.error) {
            console.error('Error loading anomalies plot data:', data.error);
            dispatch(setRenderComplete(true));
        }
    }, [data.error, dispatch]);

    const plotContainerStyle = useMemo(() => getPlotContainerStyle(plotDims), [plotDims]);
    const plotStyle = useMemo(() => getPlotStyle(darkMode), [darkMode]);

    return (
        <AsyncLoadingOverlayWrapper
            dataStatusHook={useDataStatus}
            renderCompleteSignal={renderComplete}
            minDisplayDuration={MIN_LOADING_DISPLAY_DURATION}
            onError={() => dispatch(setRenderComplete(true))}
            style={plotContainerStyle}
            isDarkTheme={darkMode}
        >
            <div ref={containerRef} style={plotStyle} id="monthlyTemperatureAnomaliesPlot" />
        </AsyncLoadingOverlayWrapper>
    );
});

MonthlyTemperatureAnomaliesBottom.displayName = 'MonthlyTemperatureAnomaliesBottom';

export default MonthlyTemperatureAnomaliesBottom;
