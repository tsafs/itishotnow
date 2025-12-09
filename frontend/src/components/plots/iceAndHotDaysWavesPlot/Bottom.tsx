import { useEffect, useRef, useMemo, memo, useState } from 'react';
import type { CSSProperties } from 'react';
import { theme, createStyles } from '../../../styles/design-system.js';
import { useBreakpoint, useBreakpointDown } from '../../../hooks/useBreakpoint.js';
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

type LegendItemStyle = Required<Pick<CSSProperties, 'width' | 'strokeWidth' | 'color'>> & CSSProperties;

const getPlotStyle = (dims: { width: number; height: number }): CSSProperties => ({
    position: 'relative',
    maxWidth: dims.width,
    maxHeight: dims.height,
});

const getLegendItemStyle = (medium: 'mobile' | 'tablet' | 'desktop' | 'wide'): LegendItemStyle => ({
    fontSize: medium === 'mobile' ? 8 : medium === 'tablet' ? 10 : 12,
    width: medium === 'mobile' ? 12 : 20,
    strokeWidth: medium === 'mobile' ? 1.5 : 2,
    color: '#eeeeee',
})

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

const getPlotStyleRules = (fontSize: number, isDarkMode: boolean): PlotStyleRuleConfig => {
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
    };
};

const IceAndHotDaysRightSide = memo(() => {
    const dispatch = useAppDispatch();
    const breakpoint = useBreakpoint();
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

    const legendItemStyle = useMemo(() => getLegendItemStyle(breakpoint), [breakpoint]);

    useEffect(() => {
        if (!selectedCityName || !containerRef.current || !data.stationId) return;

        try {
            const nextPlot = createPlot(data, plotDims);
            containerRef.current.replaceChildren(nextPlot);
            applyPlotStyles(nextPlot, getPlotStyleRules(fontSize, IS_DARK_MODE));
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
            <div style={styles.legend}>
                {(() => {
                    const currentYearLabel = data.currentYear ? String(data.currentYear.year) : 'N/A';
                    const lastYearLabel = data.lastYear ? String(data.lastYear.year) : 'N/A';
                    const referenceYearsLabel = data.referenceYears.length > 0
                        ? `${data.referenceYears[0]!.year} - ${data.referenceYears[data.referenceYears.length - 1]!.year}`
                        : 'N/A';
                    const meanLabel = data.referenceYears.length > 0 ? `Mittelwert ${referenceYearsLabel}` : 'Mittelwert';

                    const currentColor = data.currentYear ? data.currentYear.stroke : '#ff5252';
                    const lastColor = data.lastYear ? data.lastYear.stroke : '#ffcc00';
                    const refColor = '#999999';
                    const meanColor = data.mean ? data.mean.stroke : '#eeeeee';

                    return (
                        <>
                            <LegendItem label={currentYearLabel} style={{ ...legendItemStyle, color: currentColor }} />
                            <LegendItem label={lastYearLabel} style={{ ...legendItemStyle, color: lastColor }} />
                            <LegendItem label={referenceYearsLabel} style={{ ...legendItemStyle, color: refColor }} />
                            <LegendItem label={meanLabel} style={{ ...legendItemStyle, color: meanColor }} />
                        </>
                    );
                })()}
            </div>
        </AsyncLoadingOverlayWrapper>
    );
});

const LegendItem = ({ label, style }: { label: string; style: LegendItemStyle }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <LegendWave style={style} />
        <span style={{ ...style, width: 'auto' }}>{label}</span>
    </div>
);

const LegendWave = ({ style }: { style: LegendItemStyle }) => {
    const width = parseInt(style.width! + "");
    const strokeWidth = parseInt(style.strokeWidth! + "");

    const height = 10;
    const amplitude = 4; // wave height
    const cycles = 1; // number of sine cycles
    const points = 40;
    const step = width / points;
    let d = `M 0 ${height / 2}`;
    for (let i = 0; i <= points; i++) {
        const x = i * step;
        const y = height / 2 + Math.sin((i / points) * cycles * 2 * Math.PI) * amplitude;
        d += ` L ${x} ${y}`;
    }
    return (
        <svg width={width} height={height} aria-label="legend-wave" overflow="visible">
            <path d={d} stroke={style.color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
        </svg>
    );
};

IceAndHotDaysRightSide.displayName = 'IceAndHotDaysRightSide';

export default IceAndHotDaysRightSide;