import { useSelector } from 'react-redux';
import ContentSplit from '../../layout/ContentSplit';
import CountryHeatmapPlot from '../../charts/CountryHeatmapPlot';
import './View.css';

const HistoricalAnalysis = () => {
    const selectedCity = useSelector(state => state.selectedCity);

    // Left side content with tabs for different content types
    const rightContent = (
        <div className="analysis-info">
            TODO, probably links to StationDetails.jsx
        </div>
    );

    // Right side content with the scatter plot
    const leftContent = (
        <div className="heatmap-plot">
            <CountryHeatmapPlot />
        </div >
    );

    return (
        <>
            {selectedCity && (
                <div className="historical-analysis">
                    <ContentSplit
                        leftContent={leftContent}
                        rightContent={rightContent}
                        leftRatio={55}
                        rightRatio={45}
                    />
                </div>
            )}
        </>
    );
};

export default HistoricalAnalysis;
