import PlotView from '../../common/PlotView/PlotView.js';
import { theme, createStyles } from '../../../styles/design-system.js';
import { useSelectedCityName } from '../../../store/hooks/hooks.js';
import TemperatureAnomaliesByDayOverYearsLeftSide from './LeftSide.js';
import TemperatureAnomaliesByDayOverYearsRightSide from './RightSide.js';

const styles = createStyles({
    container: {
        padding: theme.spacing.md,
        backgroundColor: theme.colors.backgroundLight,
    },
});

const TemperatureAnomaliesByDayOverYears = () => {
    const selectedCityName = useSelectedCityName();

    return (
        <>
            {selectedCityName && (
                // <div style={styles.container}>
                <PlotView
                    leftContent={<TemperatureAnomaliesByDayOverYearsLeftSide />}
                    rightContent={<TemperatureAnomaliesByDayOverYearsRightSide />}
                    leftWidth={55}
                    title={`Historische Tageswerte`}
                    titleSide="right"
                />
                // </div>
            )}
        </>
    );
};

TemperatureAnomaliesByDayOverYears.displayName = 'TemperatureAnomaliesByDayOverYears';

export default TemperatureAnomaliesByDayOverYears;
