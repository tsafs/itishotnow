import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import PlotView from '../common/PlotView/PlotView.js';
import FlagLink from '../common/FlagLink.js';
import { theme, createStyles } from '../../styles/design-system.js';
import { useBreakpoint } from '../../hooks/useBreakpoint.js';

// Pure style computation functions
const getThanksStyle = (isMobile: boolean): CSSProperties => ({
    paddingLeft: isMobile ? 10 : 20,
    padding: isMobile ? '20px 10px' : undefined,
});

const getPartnerSitesH3Style = (isMobile: boolean): CSSProperties => ({
    marginBottom: '1.5rem',
    textAlign: isMobile ? 'center' : 'left',
});

const styles = createStyles({
    partnerSites: {
        padding: theme.spacing.md,
    },
    flagLinks: {
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.md,
        justifyContent: 'left',
        maxWidth: 300,
    },
});

const HistoricalAnalysis = () => {
    const breakpoint = useBreakpoint();
    const isMobile = breakpoint === 'mobile';

    // Memoized computed styles
    const thanksStyle = useMemo(
        () => getThanksStyle(isMobile),
        [isMobile]
    );

    const partnerSitesH3Style = useMemo(
        () => getPartnerSitesH3Style(isMobile),
        [isMobile]
    );

    // Left side content with tabs for different content types
    const rightContent = (
        <div style={styles.partnerSites}>
            <h3 style={partnerSitesH3Style}>Ähnliche Projekte</h3>
            <div style={styles.flagLinks}>
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
        <div style={thanksStyle}>
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
        <PlotView
            leftContent={leftContent}
            rightContent={rightContent}
            leftWidth={50}
            darkMode={true}
        />
    );
};

export default HistoricalAnalysis;
