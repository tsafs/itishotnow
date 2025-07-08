import ContentSplit from '../layout/ContentSplit';
import FlagLink from '../common/FlagLink';
import './Closing.css';

const HistoricalAnalysis = () => {
    // Left side content with tabs for different content types
    const rightContent = (
        <div className="partner-sites">
            <h3>Ähnliche Projekte</h3>
            <div className="flag-links">
                <FlagLink
                    url="https://isithotrightnow.com"
                    flagImage="https://flagcdn.com/w320/au.png"
                    title="Australia"
                />

                <FlagLink
                    url="https://istheukhotrightnow.com"
                    flagImage="https://flagcdn.com/w320/gb.png"
                    title="UK"
                />

                <FlagLink
                    url="https://scp.geographie.rub.de/isithot/lmss"
                    title="Bochum"
                    customStyle={{
                        background: 'linear-gradient(to bottom, #003399 50%, white 50%)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                />
            </div>
        </div>
    );

    // Right side content with the scatter plot
    const leftContent = (
        <div className="thanks">
            <div className="credits">
                <p>
                    Entwickelt von <a href="https://www.linkedin.com/in/sebastianfast/" target="_blank" rel="noopener noreferrer">Sebastian Fast</a><br />
                    Inspiriert durch <a href="https://isithotrightnow.com" target="_blank" rel="noopener noreferrer">isithotrightnow.com</a><br />
                </p>
                <p>
                    Herzlichen Dank für die Inspiration und wertvollen&nbsp;Beiträge&nbsp;an<br /><a href="https://www.theurbanist.com.au/about/" target="_blank" rel="noopener noreferrer">Mat Lipson</a>, {' '}
                    <a href="https://jamesgoldie.dev/" target="_blank" rel="noopener noreferrer">James Goldie</a> und {' '}
                    <a href="https://scp.geographie.rub.de/isithot/lmss" target="_blank" rel="noopener noreferrer">Jonas Kittner</a>
                </p>
            </div>

            <div className="participate">
                <p>
                    <strong>Mach mit bei diesem Projekt!</strong><br />
                    Ideen, Vorschläge oder Feedback?<br />
                    Besuche das <a href="https://github.com/tsafs/itishotnow" target="_blank" rel="noopener noreferrer">GitHub Repo</a> oder <a href="mailto:kontakt@esistwarm.jetzt">schreib mir</a>
                </p>
            </div>
        </div>
    );

    return (
        <div className="closing">
            <ContentSplit
                leftContent={leftContent}
                rightContent={rightContent}
                leftRatio={50}
                rightRatio={50}
            />
        </div>
    );
};

export default HistoricalAnalysis;
