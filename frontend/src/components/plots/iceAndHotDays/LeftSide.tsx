import { useMemo, memo } from 'react';
import type { CSSProperties } from 'react';
import { theme } from '../../../styles/design-system.js';
import { useBreakpoint } from '../../../hooks/useBreakpoint.js';
import PlotDescription from '../../common/PlotDescription/PlotDescription.js';

const getContainerStyle = (isMobile: boolean): CSSProperties => ({
    textAlign: 'center',
    marginRight: isMobile ? 0 : theme.spacing.lg,
    color: theme.colors.textLight,
});

const IceAndHotDaysLeftSide = memo(() => {
    const breakpoint = useBreakpoint();
    const isMobile = breakpoint === 'mobile' || breakpoint === 'tablet';

    const containerStyle = useMemo(() => getContainerStyle(isMobile), [isMobile]);

    return (
        <PlotDescription style={containerStyle}>
            <h2>Eistage und Hitzetage</h2>
            <p>
                Diese Grafik zeigt die Entwicklung extremer Temperaturtage über die Zeit. Die unteren, blauen Balken stellen die Anzahl der Eistage dar – Tage mit einer Höchsttemperatur bis zu 0°C. Die oberen, roten Balken zeigen die Hitzetage mit Höchsttemperaturen über 30°C.
            </p>
            <p>
                Die Farbintensität verdeutlicht, wie extrem das jeweilige Jahr im Vergleich zur Referenzperiode (1961–1990) war. Intensivere Farben deuten auf stärkere Abweichungen hin, wobei die Farbskala von dunkelblau (sehr wenig Eistage) über hell (normal) bis dunkelrot (sehr viele Hitzetage) reicht.
            </p>
            <p style={{ fontSize: '0.9em', opacity: 0.8 }}>
                <em>Die Farbsättigung basiert auf dem 5. bis 95. Perzentil der Referenzperiode, um extreme Jahre deutlich hervorzuheben.</em>
            </p>
        </PlotDescription>
    );
});

IceAndHotDaysLeftSide.displayName = 'IceAndHotDaysLeftSide';

export default IceAndHotDaysLeftSide;