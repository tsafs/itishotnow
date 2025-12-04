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

const getContainerStyle = (isVertical: boolean): CSSProperties => ({
});

// Pure style computation functions
const getPlotStyle = (isMobileOrTablet: boolean, dims: { width: number; height: number }): CSSProperties => ({
    position: 'relative',
    maxWidth: dims.width,
    maxHeight: dims.height,
    // Extra bottom margin on mobile for spacing to account for overflowing x axis labels
    marginBottom: isMobileOrTablet ? theme.spacing.lg : theme.spacing.sm,
});


const styles = createStyles({
    overlayStyle: {
        backgroundColor: theme.colors.backgroundLight
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
        mobile: { width: 320, height: 435 },
        tablet: { width: 460, height: 625 },
        desktop: { width: 640, height: 870 },
        wide: { width: 700, height: 952 }
    };
    const plotDims = MAP_DIMENSIONS[breakpoint];

    useEffect(() => {
        if (!containerRef.current || !selectedCityName || !data.iceDays || !data.hotDays) return;

        try {
            const nextPlot = createPlot(data.iceDays, data.hotDays, plotDims);
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

    const containerStyle = useMemo(
        () => getContainerStyle(isVertical),
        [isVertical]
    );

    const plotStyle = useMemo(
        () => getPlotStyle(isMobileOrTablet, plotDims),
        [isMobileOrTablet, plotDims]
    );

    return (
        <div style={containerStyle}>
            <AsyncLoadingOverlayWrapper
                dataStatusHook={useIceAndHotDaysDataStatus}
                renderCompleteSignal={renderComplete}
                minDisplayDuration={MIN_LOADING_DISPLAY_DURATION}
                onError={() => dispatch(setIceAndHotDaysRenderComplete(true))}
                style={plotStyle}
                overlayStyle={styles.overlayStyle}
                themeMode='light'
            >
                <div ref={containerRef} />
            </AsyncLoadingOverlayWrapper>
        </div>
    );
});

IceAndHotDaysRightSide.displayName = 'IceAndHotDaysRightSide';

export default IceAndHotDaysRightSide;