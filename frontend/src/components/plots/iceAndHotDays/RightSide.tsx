import { useEffect, useRef, useMemo, memo } from 'react';
import type { CSSProperties } from 'react';
import { theme, createStyles } from '../../../styles/design-system.js';
import { useBreakpoint, useBreakpointDown } from '../../../hooks/useBreakpoint.js';
import { useAppDispatch } from '../../../store/hooks/useAppDispatch.js';
import { useSelectedCityName } from '../../../store/hooks/hooks.js';
import { MIN_LOADING_DISPLAY_DURATION } from '../../../constants/page.js';
import AsyncLoadingOverlayWrapper from '../../common/AsyncLoadingOverlayWrapper/AsyncLoadingOverlayWrapper.js';
import createPlot from './plot.js';
import { useIceAndHotDaysPlotData } from './hooks/useIceAndHotDaysPlotData.js';
import { setIceAndHotDaysRenderComplete, useIceAndHotDaysRenderComplete } from '../../../store/slices/iceAndHotDaysSlice.js';
import { useIceAndHotDaysDataStatus } from './hooks/useIceAndHotDaysDataStatus.js';

const IS_DARK_MODE = true;
const themeColors = IS_DARK_MODE ? theme.colors.plotDark : theme.colors.plotLight;

const getPlotStyle = (isMobileOrTablet: boolean, dims: { width: number; height: number }): CSSProperties => ({
    position: 'relative',
    maxWidth: dims.width,
    maxHeight: dims.height,
    // Extra bottom margin on mobile for spacing to account for overflowing x axis labels
    marginBottom: isMobileOrTablet ? theme.spacing.lg : theme.spacing.sm,
});

const styles = createStyles({
    plot: {
        color: themeColors.text,
    }
});

const IceAndHotDaysRightSide = memo(() => {
    const dispatch = useAppDispatch();
    const breakpoint = useBreakpoint();
    const isVertical = useBreakpointDown('desktop');
    const isMobileOrTablet = useBreakpointDown('tablet');
    const selectedCityName = useSelectedCityName();
    const data = useIceAndHotDaysPlotData();
    const renderComplete = useIceAndHotDaysRenderComplete();
    const containerRef = useRef<HTMLDivElement | null>(null);

    // Fixed dimensions per breakpoint to keep projected shape scale consistent
    const MAP_DIMENSIONS: Record<'mobile' | 'tablet' | 'desktop' | 'wide', { width: number; height: number }> = {
        mobile: { width: 480, height: 240 },
        tablet: { width: 700, height: 350 },
        desktop: { width: 700, height: 350 },
        wide: { width: 700, height: 350 }
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
        if (!containerRef.current || !selectedCityName || !data.iceDays || !data.hotDays) return;

        try {
            const nextPlot = createPlot(data.iceDays, data.hotDays, plotDims, fontSize, IS_DARK_MODE);
            containerRef.current.replaceChildren(nextPlot);
            dispatch(setIceAndHotDaysRenderComplete(true));
        } catch (err) {
            console.error("Error creating plot:", err);
            dispatch(setIceAndHotDaysRenderComplete(true));
        }
    }, [
        selectedCityName,
        data.iceDays,
        data.hotDays,
        dispatch,
        plotDims.width,
        plotDims.height,
        fontSize
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

    const plotStyle = useMemo(() => getPlotStyle(isMobileOrTablet, plotDims), [isMobileOrTablet, plotDims]);

    return (
        <AsyncLoadingOverlayWrapper
            dataStatusHook={useIceAndHotDaysDataStatus}
            renderCompleteSignal={renderComplete}
            minDisplayDuration={MIN_LOADING_DISPLAY_DURATION}
            onError={() => dispatch(setIceAndHotDaysRenderComplete(true))}
            style={plotStyle}
            isDarkTheme={true}
        >
            <div ref={containerRef} style={styles.plot} />
        </AsyncLoadingOverlayWrapper>
    );
});

IceAndHotDaysRightSide.displayName = 'IceAndHotDaysRightSide';

export default IceAndHotDaysRightSide;