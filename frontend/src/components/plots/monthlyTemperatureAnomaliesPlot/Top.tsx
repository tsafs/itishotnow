import { memo } from 'react';
import { createStyles, theme } from '../../../styles/design-system.js';

const styles = createStyles({
    container: {
        color: theme.colors.plotLight.text,
        marginBottom: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 12,
        opacity: 0.9,
    }
});

const MonthlyTemperatureAnomaliesTop = memo(() => {
    return (
        <div style={styles.container}>
            <div style={styles.title}>Monatliche Temperatur-Anomalien</div>
            <div style={styles.subtitle}>Bezugszeitraum: 1961–1990. Positive Werte = wärmer als Referenz, negative = kälter.</div>
        </div>
    );
});

MonthlyTemperatureAnomaliesTop.displayName = 'MonthlyTemperatureAnomaliesTop';

export default MonthlyTemperatureAnomaliesTop;
