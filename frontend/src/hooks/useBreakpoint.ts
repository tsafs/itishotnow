import { useState, useEffect } from 'react';
import { theme } from '../styles/design-system';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

/**
 * Custom hook to detect current breakpoint based on window width
 * 
 * @returns Current breakpoint ('mobile' | 'tablet' | 'desktop')
 * 
 * @example
 * const breakpoint = useBreakpoint();
 * const fontSize = breakpoint === 'mobile' ? 16 : 14;
 */
export const useBreakpoint = (): Breakpoint => {
    const getBreakpoint = (): Breakpoint => {
        if (typeof window === 'undefined') return 'desktop';

        const width = window.innerWidth;

        if (width <= theme.breakpoints.mobile) {
            return 'mobile';
        } else if (width <= theme.breakpoints.tablet) {
            return 'tablet';
        } else {
            return 'desktop';
        }
    };

    const [breakpoint, setBreakpoint] = useState<Breakpoint>(getBreakpoint);

    useEffect(() => {
        const handleResize = () => {
            setBreakpoint(getBreakpoint());
        };

        // Add event listener
        window.addEventListener('resize', handleResize);

        // Call handler immediately to set initial state
        handleResize();

        // Cleanup
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return breakpoint;
};

/**
 * Hook to check if current breakpoint matches a specific one
 * 
 * @param target - Target breakpoint to check against
 * @returns Boolean indicating if current breakpoint matches
 * 
 * @example
 * const isMobile = useBreakpointMatch('mobile');
 * if (isMobile) { ... }
 */
export const useBreakpointMatch = (target: Breakpoint): boolean => {
    const breakpoint = useBreakpoint();
    return breakpoint === target;
};

/**
 * Hook to check if viewport is at or below a breakpoint
 * 
 * @param target - Breakpoint to check against
 * @returns Boolean indicating if viewport is at or below target
 * 
 * @example
 * const isMobileOrTablet = useBreakpointDown('tablet');
 */
export const useBreakpointDown = (target: Breakpoint): boolean => {
    const breakpoint = useBreakpoint();

    const order: Breakpoint[] = ['mobile', 'tablet', 'desktop'];
    const currentIndex = order.indexOf(breakpoint);
    const targetIndex = order.indexOf(target);

    return currentIndex <= targetIndex;
};

/**
 * Hook to check if viewport is above a breakpoint
 * 
 * @param target - Breakpoint to check against
 * @returns Boolean indicating if viewport is above target
 * 
 * @example
 * const isDesktop = useBreakpointUp('desktop');
 */
export const useBreakpointUp = (target: Breakpoint): boolean => {
    const breakpoint = useBreakpoint();

    const order: Breakpoint[] = ['mobile', 'tablet', 'desktop'];
    const currentIndex = order.indexOf(breakpoint);
    const targetIndex = order.indexOf(target);

    return currentIndex >= targetIndex;
};

export default useBreakpoint;
