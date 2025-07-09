import { useState } from 'react';
import { useSelector } from 'react-redux';
import ContentSplit from '../layout/ContentSplit';
import TemperaturePercentogram from '../charts/TemperaturePercentogram';
import './TemperatureDistributionAnalysis.css';

const TemperatureDistributionAnalysis = () => {
    const selectedCity = useSelector(state => state.selectedCity);
    const [timeRange, setTimeRange] = useState({ from: 1961, to: 1990 });
    const [activeTab, setActiveTab] = useState('description');

    const handleTimeRangeChange = (range) => {
        setTimeRange(range);
    };

    // Left side content with tabs for different content types
    const leftContent = (
        <div className="analysis-info">
            <h2>Temperature Distribution Analysis</h2>

            <div className="analysis-tabs">
                <button
                    className={`tab-button ${activeTab === 'description' ? 'active' : ''}`}
                    onClick={() => setActiveTab('description')}
                >
                    Description
                </button>
                <button
                    className={`tab-button ${activeTab === 'methodology' ? 'active' : ''}`}
                    onClick={() => setActiveTab('methodology')}
                >
                    Methodology
                </button>
            </div>

            <div className="tab-content">
                {activeTab === 'description' && (
                    <div className="description-content">
                        <p>See how today's temperature in {selectedCity?.station_name} compares to the historical distribution from the reference period.</p>
                        <p>The percentogram visualization shows the distribution of temperatures on this calendar day across all years in the selected period.</p>
                        <p>Each bar represents an equal percentage of the data, rather than an equal temperature range, making it easier to see where today's temperature falls in the historical record.</p>

                        <div className="time-range-selector">
                            <h3>Select Reference Period</h3>
                            <div className="time-range-buttons">
                                <button
                                    className={timeRange.from === 1961 ? 'active' : ''}
                                    onClick={() => handleTimeRangeChange({ from: 1961, to: 1990 })}
                                >
                                    1961-1990
                                </button>
                                <button
                                    className={timeRange.from === 1971 ? 'active' : ''}
                                    onClick={() => handleTimeRangeChange({ from: 1971, to: 2000 })}
                                >
                                    1971-2000
                                </button>
                                <button
                                    className={timeRange.from === 1981 ? 'active' : ''}
                                    onClick={() => handleTimeRangeChange({ from: 1981, to: 2010 })}
                                >
                                    1981-2010
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'methodology' && (
                    <div className="methodology-content">
                        <p>The percentogram is a histogram binned by percentiles of the data, rather than using fixed bin widths.</p>
                        <p>This creates a distribution where each bar has the same number of observations, making it easier to see where a value falls in the distribution.</p>
                        <p>The color gradient helps visualize the percentile ranges, from blue (lower percentiles) to red (higher percentiles).</p>
                        <p>The vertical red line indicates today's temperature, allowing you to quickly see if today is unusually warm or cold compared to the historical record.</p>
                    </div>
                )}
            </div>
        </div>
    );

    // Right side content with the percentogram visualization
    const rightContent = (
        <TemperaturePercentogram />
    );

    return (
        <div className="temperature-distribution-analysis">
            <ContentSplit
                leftContent={leftContent}
                rightContent={rightContent}
                leftRatio={30}
                rightRatio={70}
            />
        </div>
    );
};

export default TemperatureDistributionAnalysis;
