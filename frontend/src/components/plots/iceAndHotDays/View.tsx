import { createStackedPlotView } from '../../common/PlotView/createStackedPlotView.js';
import IceAndHotDaysTop from './Top.js';
import IceAndHotDaysBottom from './Bottom.js';

const IceAndHotDays = createStackedPlotView({
    topContent: IceAndHotDaysTop,
    bottomContent: IceAndHotDaysBottom,
    config: {
        darkMode: true,
    },
});

export default IceAndHotDays;
