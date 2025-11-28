import { getAnomalyColor } from '../../../utils/TemperatureUtils.js';
import type { ColorSchemeName } from '../../../utils/TemperatureUtils.js';
import { theme, createStyles } from '../../../styles/design-system.js';

interface MapLegendProps {
    title?: string;
    colorScheme?: ColorSchemeName;
}

const styles = createStyles({
    container: {
        width: 300,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: 10,
        color: theme.colors.textLight,
        textShadow: '0px 0px 10px rgba(0, 0, 0, 1)',
    },
    title: {
        textAlign: 'center',
        marginBottom: 5,
        fontSize: '0.9em',
    },
    colorsContainer: {
        display: 'flex',
        width: '100%',
        height: 12,
        marginBottom: 4,
        borderRadius: 100,
    },
    colorBox: {
        flex: 1,
        height: '100%',
    },
    labelsContainer: {
        display: 'flex',
        width: '100%',
        height: '1em',
    },
    label: {
        flex: 1,
        fontSize: '0.8em',
        textAlign: 'center',
    },
});

const getColorBoxStyle = (idx: number, total: number) => ({
    borderTopLeftRadius: idx === 0 ? 5 : 0,
    borderBottomLeftRadius: idx === 0 ? 5 : 0,
    borderTopRightRadius: idx === total - 1 ? 5 : 0,
    borderBottomRightRadius: idx === total - 1 ? 5 : 0,
});

const MapLegend = ({ title, colorScheme = 'BlueWhiteRed' }: MapLegendProps) => {
    // Create an array from -10 to +10 with steps of 2
    const anomalyValues = Array.from({ length: 11 }, (_, i) => (i * 2) - 10);

    return (
        <div style={styles.container}>
            {title && (
                <div style={styles.title}>
                    {title}
                </div>
            )}
            <div style={styles.colorsContainer}>
                {anomalyValues.map((value, idx) => (
                    <div
                        key={`color-${value}`}
                        style={{
                            ...styles.colorBox,
                            ...getColorBoxStyle(idx, anomalyValues.length),
                            backgroundColor: getAnomalyColor(value, colorScheme),
                        }}
                    />
                ))}
            </div>

            <div style={styles.labelsContainer}>
                {anomalyValues.map(value => (
                    <div
                        key={`label-${value}`}
                        style={styles.label}
                    >
                        {value}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MapLegend;
