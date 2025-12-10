import Top from './Top.js';
import Bottom from './Bottom.js';
import { createStackedPlotView } from '../../common/PlotView/createStackedPlotView.js';

const View = createStackedPlotView({
    topContent: Top,
    bottomContent: Bottom,
    config: {
        darkMode: false,
    },
});

View.displayName = 'MonthlyTemperatureAnomaliesView';

export default View;
