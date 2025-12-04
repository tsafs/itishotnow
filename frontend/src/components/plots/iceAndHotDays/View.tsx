import { createPlotView } from '../../common/PlotView/createPlotView.js';
import IceAndHotDaysLeftSide from './LeftSide.js';
import IceAndHotDaysRightSide from './RightSide.js';

const IceAndHotDays = createPlotView({
    leftContent: IceAndHotDaysLeftSide,
    rightContent: IceAndHotDaysRightSide,
    config: {
        leftWidth: 45,
        darkMode: false,
    },
});

export default IceAndHotDays;
