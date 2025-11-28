import { createPlotView } from '../../common/PlotView/createPlotView.js';
import HeatmapGermanyLeftSide from './LeftSide.js';
import HeatmapGermanyRightSide from './RightSide.js';

const HeatmapGermany = createPlotView({
    leftContent: HeatmapGermanyLeftSide,
    rightContent: HeatmapGermanyRightSide,
    config: {
        leftWidth: 45,
        darkMode: true,
    },
});

export default HeatmapGermany;
