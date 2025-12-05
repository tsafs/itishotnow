import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { useAsyncLoadingOverlay } from '../../../hooks/useAsyncLoadingOverlay.js';
import LoadingError from '../LoadingError/LoadingError.js';
import { MIN_LOADING_DISPLAY_DURATION } from '../../../constants/page.js';
import { createStyles, theme } from '../../../styles/design-system.js';

interface AsyncLoadingOverlayWrapperProps {
    dataStatusHook: () => { isLoading: boolean; error: string | null };
    renderCompleteSignal: boolean;
    minDisplayDuration?: number;
    placeholder?: ReactNode;
    errorFallback?: ReactNode | ((message: string) => ReactNode);
    onError?: (message: string) => void;
    children: ReactNode;
    className?: string;
    style?: CSSProperties;
    overlayClassName?: string;
    overlayStyle?: CSSProperties;
    isDarkTheme?: boolean;
}

const SHIMMER_ANIMATION_NAME = 'async-loading-overlay-shimmer';
const shimmerKeyframes = `@keyframes ${SHIMMER_ANIMATION_NAME} {
    0%, 100% { opacity: 0.3; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.2); }
}`;

const getOverlayLayerStyle = (isDarkTheme: boolean): CSSProperties => ({
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isDarkTheme ? theme.colors.plotDark.background : theme.colors.plotLight.background,
    zIndex: 2,
});

const styles = createStyles({
    container: {
        position: 'relative' as const,
    }
});

const defaultStyles = createStyles({
    shimmerContainer: {
        display: 'flex',
        gap: '8px',
    },
    shimmerDot: {
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        animation: `${SHIMMER_ANIMATION_NAME} 1.4s ease-in-out infinite`,
    },
});

interface DefaultShimmerProps {
    color: string;
}

const DefaultShimmer = ({ color }: DefaultShimmerProps) => (
    <div style={defaultStyles.shimmerContainer}>
        <div style={{ ...defaultStyles.shimmerDot, backgroundColor: color, animationDelay: '0s' }}></div>
        <div style={{ ...defaultStyles.shimmerDot, backgroundColor: color, animationDelay: '0.2s' }}></div>
        <div style={{ ...defaultStyles.shimmerDot, backgroundColor: color, animationDelay: '0.4s' }}></div>
    </div>
);

const AsyncLoadingOverlayWrapper = ({
    dataStatusHook,
    renderCompleteSignal,
    minDisplayDuration = MIN_LOADING_DISPLAY_DURATION,
    placeholder,
    errorFallback,
    onError,
    children,
    className,
    style,
    overlayClassName,
    overlayStyle,
    isDarkTheme = true,
}: AsyncLoadingOverlayWrapperProps) => {
    const { isLoading, error } = useAsyncLoadingOverlay({
        dataStatusHook,
        renderCompleteSignal,
        minDisplayDuration,
    });

    const lastNotifiedError = useRef<string | null>(null);

    useEffect(() => {
        if (!error) {
            lastNotifiedError.current = null;
            return;
        }

        if (error !== lastNotifiedError.current) {
            onError?.(error);
            lastNotifiedError.current = error;
        }
    }, [error, onError]);

    const showOverlay = isLoading || Boolean(error);

    const shimmerDotColor = isDarkTheme ? theme.colors.plotDark.foreground : theme.colors.plotLight.foreground; // Keep shimmer legible against overlay

    const resolvedPlaceholder = error
        ? typeof errorFallback === 'function'
            ? errorFallback(error)
            : errorFallback ?? <LoadingError message={error} />
        : placeholder ?? <DefaultShimmer color={shimmerDotColor} />;

    const overlayLayerStyle = getOverlayLayerStyle(isDarkTheme);

    return (
        <div className={className} style={{ ...styles.container, ...style }}>
            <style>{shimmerKeyframes}</style>
            {children}
            {showOverlay && (
                <div
                    className={overlayClassName}
                    style={{ ...overlayLayerStyle, ...overlayStyle }}
                >
                    {resolvedPlaceholder}
                </div>
            )}
        </div>
    );
};

export type { AsyncLoadingOverlayWrapperProps };
export default AsyncLoadingOverlayWrapper;
