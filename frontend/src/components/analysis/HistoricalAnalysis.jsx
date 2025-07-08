import { useSelector } from 'react-redux';
import ContentSplit from '../layout/ContentSplit';
import TemperatureScatterPlot from '../charts/TemperatureScatterPlot';
import './HistoricalAnalysis.css';

const HistoricalAnalysis = () => {
    const selectedCity = useSelector(state => state.selectedCity);

    // Left side content with tabs for different content types
    const rightContent = (
        <div className="analysis-info">
            <p>
                Diese Grafik zeigt, wie warm der <strong>heutige Tag</strong> im Vergleich zu früheren Jahren ist. Sie umfasst Daten seit <strong>1951</strong> für die ausgewählte Wetterstation.
            </p>
            <p>
                Jeder <strong>farbige Punkt</strong> steht für ein Jahr. Der Wert zeigt die durchschnittliche Temperatur am heutigen Kalendertag. Um zufällige Wetterschwankungen auszugleichen, wird ein Durchschnitt aus den umliegenden Tagen gebildet (7 Tage davor und 7 Tage danach).
            </p>
            <p>
                Die horizontale <strong>Nulllinie</strong> entspricht dem Durchschnitt der Jahre <strong>1961-1990</strong>. <span style={{ color: '#d73027' }}>Rote&nbsp;Punkte</span> über dieser Linie zeigen wärmere Jahre, <span style={{ color: '#4575b4' }}>blaue&nbsp;Punkte</span> kältere Jahre über und unter dem Durchschnitt. Die grauen Punkte im Hintergrund zeigen die Werte der umliegenden Tage und geben einen breiteren Kontext.
            </p>
            <p>
                Der <strong>aktuelle Wert</strong> basiert auf den bisher heute gemessenen Temperaturen. Das vollständige Bild entsteht daher erst am Ende des Tages oder nach Erreichen der Tageshöchsttemperatur.
            </p>
        </div>
    );

    // Right side content with the scatter plot
    const leftContent = (
        <div className="scatter-plot">
            <TemperatureScatterPlot />
        </div >
    );

    return (
        <>
            {selectedCity && (
                <div className="historical-analysis">
                    <ContentSplit
                        leftContent={leftContent}
                        rightContent={rightContent}
                        leftRatio={55}
                        rightRatio={45}
                    />
                </div>
            )}
        </>
    );
};

export default HistoricalAnalysis;
