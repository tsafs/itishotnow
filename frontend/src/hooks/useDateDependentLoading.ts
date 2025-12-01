import { useEffect, useRef, useState } from 'react';

interface DateDependentLoadingOptions {
    dataStatusHook: () => { isLoading: boolean; error: string | null };
    renderCompleteSignal: boolean;
    minDisplayDuration: number;
}

interface DateDependentLoadingResult {
    isLoading: boolean;
    error: string | null;
}

export const useDateDependentLoading = ({
    dataStatusHook,
    renderCompleteSignal,
    minDisplayDuration,
}: DateDependentLoadingOptions): DateDependentLoadingResult => {
    const { isLoading: sliceLoading, error } = dataStatusHook();
    const [isOverlayVisible, setIsOverlayVisible] = useState(true);
    const loadingStartRef = useRef<number | null>(null);
    const hideTimeoutRef = useRef<number | null>(null);

    const shouldHoldOverlay = sliceLoading || !renderCompleteSignal;

    useEffect(() => {
        // Clean up on unmount
        return () => {
            if (hideTimeoutRef.current !== null) {
                window.clearTimeout(hideTimeoutRef.current);
                hideTimeoutRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (shouldHoldOverlay) {
            if (hideTimeoutRef.current !== null) {
                window.clearTimeout(hideTimeoutRef.current);
                hideTimeoutRef.current = null;
            }
            if (loadingStartRef.current === null) {
                loadingStartRef.current = performance.now();
            }
            setIsOverlayVisible(true);
            return;
        }

        const now = performance.now();
        const elapsed = loadingStartRef.current !== null ? now - loadingStartRef.current : minDisplayDuration;
        const remaining = Math.max(minDisplayDuration - elapsed, 0);

        if (remaining <= 0) {
            loadingStartRef.current = null;
            setIsOverlayVisible(error ? true : false);
            return;
        }

        hideTimeoutRef.current = window.setTimeout(() => {
            loadingStartRef.current = null;
            hideTimeoutRef.current = null;
            setIsOverlayVisible(error ? true : false);
        }, remaining);

        return () => {
            if (hideTimeoutRef.current !== null) {
                window.clearTimeout(hideTimeoutRef.current);
                hideTimeoutRef.current = null;
            }
        };
    }, [error, minDisplayDuration, shouldHoldOverlay]);

    useEffect(() => {
        if (error) {
            setIsOverlayVisible(true);
        }
    }, [error]);

    return {
        isLoading: isOverlayVisible,
        error,
    };
};
