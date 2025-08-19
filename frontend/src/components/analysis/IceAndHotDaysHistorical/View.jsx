import { useEffect, useRef, useState } from 'react';
import FlexibleSplit from '../../layout/FlexibleSplit';
import './View.css';
import { useSelectedItem } from '../../../store/hooks/selectedItemHook';
import { useIceAndHotDaysForSelectedStation } from '../../../store/hooks/useIceAndHotDaysForSelectedStation';
import createPlot from './Plot';
import PlotScrollWrapper from './PlotScrollWrapper';

const View = () => {
    const selectedItem = useSelectedItem();
    const iceAndHotDays = useIceAndHotDaysForSelectedStation();

    const [firstYear, setFirstYear] = useState("");
    const [lastYear, setLastYear] = useState("");

    const plotRef = useRef();

    const hasPlot =
        iceAndHotDays &&
        iceAndHotDays.daysBelow0Tmax &&
        iceAndHotDays.daysAbove30Tmax &&
        (iceAndHotDays.daysBelow0Tmax.x || []).length > 0;

    // Render static plot (base map, contours) only when geojson or correlatedData changes
    useEffect(() => {
        if (!iceAndHotDays) return;

        const { daysBelow0Tmax, daysAbove30Tmax } = iceAndHotDays;
        const years = daysBelow0Tmax.x || [];
        if (years.length > 0) {
            setFirstYear(years[0]);
            setLastYear(years[years.length - 1]);
        }

        const plot = createPlot(daysBelow0Tmax, daysAbove30Tmax);
        if (!plot) return;

        if (plotRef.current) {
            plotRef.current.innerHTML = '';
        }
        plotRef.current.appendChild(plot);
    }, [iceAndHotDays]);

    // Left side content with tabs for different content types
    const firstContent = (
        <div className="plot-container-view">
            <div className="plot-title-view">Anzahl Eis- und Hitzetage in {selectedItem?.city.name} ({firstYear}-{lastYear})</div>
            <PlotScrollWrapper width="1000">
                <div ref={plotRef}></div>
            </PlotScrollWrapper>
        </div>
    );

    // Right side content with the scatter plot
    const secondContent = (
        <div className="description bg-black">
            Eistage sind Tage mit einer maximalen Temperatur unter 0°C. Heiße Tage sind Tage mit einer maximalen Temperatur über 30°C.
        </div >
    );

    return hasPlot ? (
        <div className="ice-and-hot-days-historical-view">
            <FlexibleSplit
                firstContent={firstContent}
                secondContent={secondContent}
                firstRatio={45}
                secondRatio={55}
            // topDown={true}
            />
        </div>
    ) : null;
};

export default View;
