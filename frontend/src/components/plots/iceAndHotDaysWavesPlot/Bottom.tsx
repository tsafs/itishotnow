import { useEffect, useRef, useMemo, memo, useState } from 'react';
import type { CSSProperties } from 'react';
import { theme, createStyles } from '../../../styles/design-system.js';
import { useBreakpoint } from '../../../hooks/useBreakpoint.js';
import { useAppDispatch } from '../../../store/hooks/useAppDispatch.js';
import { useSelectedCityName } from '../../../store/hooks/hooks.js';
import { MIN_LOADING_DISPLAY_DURATION } from '../../../constants/page.js';
import AsyncLoadingOverlayWrapper from '../../common/AsyncLoadingOverlayWrapper/AsyncLoadingOverlayWrapper.js';
import createPlot from './plot.js';
import { usePlotData } from './hooks/usePlotData.js';
import { setIceAndHotDaysRenderComplete, useIceAndHotDaysRenderComplete } from '../../../store/slices/iceAndHotDaysSlice.js';
import { useDataStatus } from './hooks/useDataStatus.js';
import { applyPlotStyles, type PlotStyleRuleConfig } from '../../../utils/stylingUtils.js';

const IS_DARK_MODE = true;
const themeColors = IS_DARK_MODE ? theme.colors.plotDark : theme.colors.plotLight;

const getPlotStyle = (dims: { width: number; height: number }): CSSProperties => ({
    position: 'relative',
    maxWidth: dims.width,
    maxHeight: dims.height,
});

const styles = createStyles({
    plot: {
        color: themeColors.text,
    },
    legend: {
        display: 'flex',
        justifyContent: 'center',
        gap: 8,
    }
});

const getPlotStyleRules = (isMobile: boolean, fontSize: number, isDarkMode: boolean): PlotStyleRuleConfig => {
    const currentThemeColors = isDarkMode ? theme.colors.plotDark : theme.colors.plotLight;
    const axisColor = currentThemeColors.text;
    return {
        'g[aria-label="y-axis label"]': {
            fontWeight: 'bold',
            fontSize,
            color: axisColor,
            fill: axisColor,
        },
        'line[aria-label="frame"]': {
            strokeWidth: 2
        },
        'g[aria-label="y-axis tick"] > path': {
            strokeWidth: 2
        },
        'figure': {
            display: 'flex',
            flexDirection: 'column-reverse', // to place legend at bottom
            alignItems: 'center',
            flexWrap: 'nowrap',
        },
        '.legend-swatches-wrap': {
            marginLeft: isMobile ? '5px' : '40px', // to align with x-axis center
            marginBottom: 0, // reset default margin
            gap: isMobile ? '8px' : '16px',
            minHeight: 0, // reset default minHeight
        },
        '.legend-swatch': {
            marginRight: 0, // reset default margin
        },
        '.legend-swatch > svg': {
            width: isMobile ? 10 : 15,
            height: isMobile ? 10 : 15,
        }
    };
};

const IceAndHotDaysRightSide = memo(() => {
    const dispatch = useAppDispatch();
    const breakpoint = useBreakpoint();
    const isMobile = breakpoint === 'mobile';
    const selectedCityName = useSelectedCityName();
    const data = usePlotData();
    const renderComplete = useIceAndHotDaysRenderComplete();
    const containerRef = useRef<HTMLDivElement | null>(null);

    // Fixed dimensions per breakpoint to keep projected shape scale consistent
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
        if (!selectedCityName || !containerRef.current || !data.stationId) return;

        try {
            const nextPlot = createPlot(data, plotDims);
            console.log(nextPlot);
            containerRef.current.replaceChildren(nextPlot);
            applyPlotStyles(nextPlot, getPlotStyleRules(isMobile, fontSize, IS_DARK_MODE));
            dispatch(setIceAndHotDaysRenderComplete(true));
        } catch (err) {
            console.error("Error creating plot:", err);
            dispatch(setIceAndHotDaysRenderComplete(true));
        }
    }, [
        selectedCityName,
        data,
        dispatch,
        plotDims.width,
        plotDims.height,
        isMobile,
        fontSize,
    ]);

    // Cleanup on unmount
    useEffect(() => () => {
        containerRef.current = null;
    }, []);

    useEffect(() => {
        if (data.error) {
            console.error("Error loading plot data:", data.error);
            dispatch(setIceAndHotDaysRenderComplete(true));
        }
    }, [data.error, dispatch]);

    const plotStyle = useMemo(() => getPlotStyle(plotDims), [plotDims]);

    return (
        <AsyncLoadingOverlayWrapper
            dataStatusHook={useDataStatus}
            renderCompleteSignal={renderComplete}
            minDisplayDuration={MIN_LOADING_DISPLAY_DURATION}
            onError={() => dispatch(setIceAndHotDaysRenderComplete(true))}
            style={plotStyle}
            isDarkTheme={true}
        >
            <div ref={containerRef} style={styles.plot} id="iceAndHotDaysWavesPlot" />
        </AsyncLoadingOverlayWrapper>
    );
});

IceAndHotDaysRightSide.displayName = 'IceAndHotDaysRightSide';

export default IceAndHotDaysRightSide;