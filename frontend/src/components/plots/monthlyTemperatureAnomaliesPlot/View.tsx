import { memo } from 'react';
import Top from './Top.js';
import Bottom from './Bottom.js';
import { createStackedPlotView } from '../../common/PlotView/createStackedPlotView.js';

const View = createStackedPlotView({
    topContent: Top,
    bottomContent: Bottom,
    config: {
        darkMode: true,
    },
});

View.displayName = 'MonthlyTemperatureAnomaliesView';

export default View;
