import { createPlotView } from '../../common/PlotView/createPlotView.js';
import TemperatureAnomaliesByDayOverYearsLeftSide from './LeftSide.js';
import TemperatureAnomaliesByDayOverYearsRightSide from './RightSide.js';

const TemperatureAnomaliesByDayOverYears = createPlotView({
    leftContent: TemperatureAnomaliesByDayOverYearsLeftSide,
    rightContent: TemperatureAnomaliesByDayOverYearsRightSide,
    config: {
        leftWidth: 55,
        title: 'Historische Tageswerte',
        titleSide: 'right',
        darkMode: false,
    }
});

export default TemperatureAnomaliesByDayOverYears;
