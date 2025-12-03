import { useEffect, useRef, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { theme, createStyles } from '../../../styles/design-system.js';
import { useBreakpoint } from '../../../hooks/useBreakpoint.js';
import { useSelectedCityName, useTemperatureAnomaliesDataStatus } from '../../../store/hooks/hooks.js';
import { useAppDispatch } from '../../../store/hooks/useAppDispatch.js';
import {
    setCityChangeRenderComplete,
    useTemperatureAnomaliesRenderComplete,
} from '../../../store/slices/temperatureAnomaliesByDayOverYearsSlice.js';
import { MIN_LOADING_DISPLAY_DURATION } from '../../../constants/page.js';
import AsyncLoadingOverlayWrapper from '../../common/AsyncLoadingOverlayWrapper/AsyncLoadingOverlayWrapper.js';
import { useTemperatureAnomalyPlotData } from './hooks/useTemperatureAnomalyPlotData.js';
import './LeftSide.css';
import { createPlot } from './plot.js';

// Pure style computation functions
const getContainerStyle = (isMobile: boolean): CSSProperties => ({
    overflow: 'visible',
    textAlign: 'center',
    margin: isMobile ? 0 : undefined,
});

const getPlotStyle = (dims: { width: number; height: number }): CSSProperties => ({
    position: 'relative',
    maxWidth: dims.width,
    maxHeight: dims.height,
    marginBottom: theme.spacing.sm,
});

const styles = createStyles({
    plotRef: {
        overflow: 'visible',
    },
    overlayStyle: {
        backgroundColor: theme.colors.backgroundLight
    }
});

const TemperatureAnomaliesByDayOverYearsLeftSide = () => {
    const dispatch = useAppDispatch();
    const breakpoint = useBreakpoint();

    const containerRef = useRef<HTMLDivElement | null>(null);

    const selectedCityName = useSelectedCityName();

    const renderComplete = useTemperatureAnomaliesRenderComplete();

    const isMobile = breakpoint === 'mobile';


    // Fixed dimensions per breakpoint to keep projected shape scale consistent
    const MAP_DIMENSIONS: Record<'mobile' | 'tablet' | 'desktop' | 'wide', { width: number; height: number }> = {
        mobile: { width: 400, height: 286 },
        tablet: { width: 600, height: 428 },
        desktop: { width: 700, height: 500 },
        wide: { width: 700, height: 500 }
    };
    const plotDims = MAP_DIMENSIONS[breakpoint];

    const fromYear = 1951;
    const toYear = 2024;
    const baselineStartYear = 1961; // Define baseline start year
    const baselineEndYear = 1990;   // Define baseline end year

    const {
        plotData,
        anomaliesForDetails,
        todayDataPoint,
        formattedTrend,
        isToday,
        targetDate,
        error: plotDataError,
    } = useTemperatureAnomalyPlotData({
        fromYear,
        toYear,
        baselineStartYear,
        baselineEndYear,
    });

    useEffect(() => {
        const container = containerRef.current;

        if (!container || !selectedCityName || !plotData || !targetDate) return;

        try {
            const nextPlot = createPlot(baselineStartYear, baselineEndYear, plotData, todayDataPoint, isToday, targetDate, formattedTrend, anomaliesForDetails, selectedCityName, fromYear, toYear, plotDims);
            container.replaceChildren(nextPlot);
            dispatch(setCityChangeRenderComplete(true));
        } catch (err) {
            console.error("Error creating plot:", err);
            dispatch(setCityChangeRenderComplete(true));
        }
    }, [
        anomaliesForDetails,
        baselineEndYear,
        baselineStartYear,
        dispatch,
        formattedTrend,
        fromYear,
        isToday,
        plotData,
        selectedCityName,
        targetDate,
        todayDataPoint,
        toYear,
        plotDims.width,
        plotDims.height,
    ]);

    // Cleanup on unmount
    useEffect(() => () => {
        containerRef.current = null;
    }, []);

    useEffect(() => {
        if (plotDataError) {
            console.error("Error loading plot data:", plotDataError);
            dispatch(setCityChangeRenderComplete(true));
        }
    }, [plotDataError, dispatch]);

    // Memoized computed styles
    const containerStyle = useMemo(
        () => getContainerStyle(isMobile),
        [isMobile]
    );

    const plotStyle = useMemo(
        () => getPlotStyle(plotDims),
        [plotDims]
    );

    return (
        <div style={containerStyle} className="temperature-scatter-plot-container">
            <AsyncLoadingOverlayWrapper
                dataStatusHook={useTemperatureAnomaliesDataStatus}
                renderCompleteSignal={renderComplete}
                minDisplayDuration={MIN_LOADING_DISPLAY_DURATION}
                onError={() => dispatch(setCityChangeRenderComplete(true))}
                style={plotStyle}
                overlayStyle={styles.overlayStyle}
                themeMode='light'
            >
                <div ref={containerRef} style={styles.plotRef}></div>
            </AsyncLoadingOverlayWrapper>
        </div>
    );
};

TemperatureAnomaliesByDayOverYearsLeftSide.displayName = 'TemperatureAnomaliesByDayOverYearsLeftSide';

export default TemperatureAnomaliesByDayOverYearsLeftSide;
