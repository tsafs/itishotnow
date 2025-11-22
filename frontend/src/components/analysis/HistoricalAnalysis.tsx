import PlotView from '../common/PlotView/PlotView.js';
import PlotDescription from '../common/PlotDescription/PlotDescription.js';
import TemperatureScatterPlot from '../charts/TemperatureScatterPlot.js';
import { theme, createStyles } from '../../styles/design-system.js';
import { useSelectedDate } from '../../store/slices/selectedDateSlice.js';
import { DateTime } from 'luxon';
import { getNow } from '../../utils/dateUtils.js';
import { useSelectedCityName } from '../../store/hooks/hooks.js';

const styles = createStyles({
    container: {
        padding: theme.spacing.md,
        backgroundColor: theme.colors.backgroundLight,
    },
    scatterPlot: {
        height: '100%',
    },
});

const HistoricalAnalysis = () => {
    const selectedCityName = useSelectedCityName();
    const selectedDate = useSelectedDate();
    const isToday = DateTime.fromISO(selectedDate).hasSame(getNow(), 'day');
    const selectedCityNameDisplay = selectedCityName ?? 'dieser Stadt';

    // Format date as "7. Oktober 2025"
    const formattedDate = DateTime.fromISO(selectedDate).setLocale('de').toFormat("d. MMMM yyyy");

    // Description content
    const description = (
        <PlotDescription>
            <p>
                Diese Grafik zeigt, wie warm der <strong>{isToday ? "heutige Tag" : formattedDate}</strong> im Vergleich zu früheren Jahren ist. Sie umfasst Daten seit <strong>1951</strong> für die Wetterstation in {selectedCityNameDisplay}.
            </p>
            <p>
                Jeder <strong>farbige Punkt</strong> steht für ein Jahr. Der Wert zeigt die durchschnittliche Tagestemperatur am {isToday ? "heutigen Kalendertag" : formattedDate}. Um zufällige Wetterschwankungen auszugleichen, wird ein Durchschnitt aus den umliegenden Tagen gebildet (7 Tage davor und 7 Tage danach).
            </p>
            <p>
                Die horizontale <strong>Nulllinie</strong> entspricht dem Durchschnitt der Jahre <strong>1961-1990</strong>. <span style={{ color: '#d73027' }}>Rote&nbsp;Punkte</span> über dieser Linie zeigen wärmere Jahre, <span style={{ color: '#4575b4' }}>blaue&nbsp;Punkte</span> kältere Jahre über und unter dem Durchschnitt. Die grauen Punkte im Hintergrund zeigen die Werte der umliegenden Tage und geben einen breiteren Kontext.
            </p>
            {isToday && (
                <p>
                    Der <strong>aktuelle Wert</strong> basiert auf den bisher heute gemessenen Temperaturen. Das vollständige Bild entsteht daher erst am Ende des Tages oder nach Erreichen der Tageshöchsttemperatur.
                </p>
            )}
        </PlotDescription>
    );

    // Plot content
    const plot = (
        <div style={styles.scatterPlot}>
            <TemperatureScatterPlot />
        </div>
    );

    return (
        <>
            {selectedCityName && (
                <div style={styles.container}>
                    <PlotView
                        leftContent={plot}
                        rightContent={description}
                        leftWidth={55}
                    />
                </div>
            )}
        </>
    );
};

export default HistoricalAnalysis;
