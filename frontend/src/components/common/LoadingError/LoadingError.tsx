import type { CSSProperties } from 'react';
import { createStyles, theme } from '../../../styles/design-system.js';

interface LoadingErrorProps {
    message: string;
    style?: CSSProperties;
}

const styles = createStyles({
    container: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: theme.spacing.lg,
        width: '100%',
        height: '100%',
        color: theme.colors.hot,
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.medium,
        textShadow: '0 0 6px rgba(0, 0, 0, 0.45)',
    },
});

const LoadingError = ({ message, style }: LoadingErrorProps) => {
    return (
        <div style={{ ...styles.container, ...style }}>
            {message}
        </div>
    );
};

export default LoadingError;
