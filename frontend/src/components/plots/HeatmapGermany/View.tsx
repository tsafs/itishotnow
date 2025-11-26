import { memo } from 'react';
import PlotView from '../../common/PlotView/PlotView.js';
import HeatmapGermanyLeftSide from './LeftSide.js';
import HeatmapGermanyRightSide from './RightSide.js';

const HeatmapGermany = memo(() => {
    return (
        <PlotView
            leftContent={<HeatmapGermanyLeftSide />}
            rightContent={<HeatmapGermanyRightSide />}
            leftWidth={45}
        />
    );
});

HeatmapGermany.displayName = 'HeatmapGermany';

export default HeatmapGermany;
