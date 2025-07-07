import { useSelector } from 'react-redux';
import ContentSplit from '../layout/ContentSplit';
import TemperatureScatterPlot from '../charts/TemperatureScatterPlot';
import './HistoricalAnalysis.css';

const HistoricalAnalysis = () => {
    const selectedCity = useSelector(state => state.selectedCity);

    // Left side content with tabs for different content types
    const rightContent = (
        <div className="analysis-info">
            <h2>Was zeigt diese Grafik?</h2>
            <p>
                Die Grafik zeigt die Temperaturentwicklung am heutigen Kalendertag für die ausgewählte Wetterstation seit 1951. Jeder farbige Punkt steht für die Durchschnittstemperatur an diesem Tag in einem bestimmten Jahr, gemittelt inklusive der Durchschnittstemperaturen der umliegenden Tage (jeweils 7 Tage davor und danach).
            </p>
            <p>
                Als Vergleich dient der Durchschnitt des Referenzzeitraums 1961–1990 (Nulllinie). Punkte oberhalb der Linie waren wärmer als dieser historische Durchschnitt, Punkte unterhalb kälter. Die Farbe der Punkte zeigt dies ebenfalls an (Blau = kälter, Rot = wärmer).
            </p>
            <p>
                Die gestrichelte Linie visualisiert den langfristigen Erwärmungstrend. Der Wert <strong>Trend / Jahrzehnt</strong> gibt an, um wie viel Grad es pro Jahrzehnt im Durchschnitt wärmer geworden ist. Die grauen Punkte im Hintergrund zeigen zur besseren Einordnung die Durchschnittstemperaturen der umliegenden Tage.
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
