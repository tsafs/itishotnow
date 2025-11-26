import { createPlotView } from '../../common/PlotView/createPlotView.js';
import TemperatureAnomaliesByDayOverYearsLeftSide from './LeftSide.js';
import TemperatureAnomaliesByDayOverYearsRightSide from './RightSide.js';
import { useSelectedCityName } from '../../../store/hooks/hooks.js';

const TemperatureAnomaliesByDayOverYears = createPlotView({
    leftContent: TemperatureAnomaliesByDayOverYearsLeftSide,
    rightContent: TemperatureAnomaliesByDayOverYearsRightSide,
    config: {
        leftWidth: 55,
        title: 'Historische Tageswerte',
        titleSide: 'right',
        darkMode: false,
    },
    useShouldRender: () => {
        const cityName = useSelectedCityName();
        return !!cityName;
    },
});

export default TemperatureAnomaliesByDayOverYears;
