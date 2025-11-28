import { useState, useEffect, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import StationSearch from './StationSearch.js';
import DateSelection from './DateSelection.js';
import { createStyles } from '../../styles/design-system.js';
import { useBreakpoint } from '../../hooks/useBreakpoint.js';

// Pure style computation functions
const getHeaderStyle = (isVisible: boolean): CSSProperties => ({
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fefefe',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    zIndex: 1100,
    transition: 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out',
    transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
    opacity: isVisible ? 1 : 0,
    pointerEvents: isVisible ? 'auto' : 'none',
});

const getMenuContainerStyle = (isMobile: boolean): CSSProperties => ({
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '10px 20px',
    gap: 10,
    width: '100%',
});

const getSearchStyle = (isMobile: boolean): CSSProperties => ({
    width: isMobile ? '100%' : 300,
});

const Header = () => {
    const breakpoint = useBreakpoint();
    const isMobile = breakpoint === 'mobile';
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [scrollUpDistance, setScrollUpDistance] = useState(0);
    const scrollUpThreshold = 100;

    // Memoized computed styles
    const headerStyle = useMemo(
        () => getHeaderStyle(isVisible),
        [isVisible]
    );

    const menuContainerStyle = useMemo(
        () => getMenuContainerStyle(isMobile),
        [isMobile]
    );

    const searchStyle = useMemo(
        () => getSearchStyle(isMobile),
        [isMobile]
    );

    useEffect(() => {
        const controlHeader = () => {
            const currentScrollY = window.scrollY;

            // Calculate scroll up distance when scrolling up
            if (currentScrollY < lastScrollY) {
                // We're scrolling up
                const newScrollUpDistance = lastScrollY - currentScrollY + scrollUpDistance;
                setScrollUpDistance(newScrollUpDistance);

                // Show header only when we've scrolled up enough
                if (newScrollUpDistance >= scrollUpThreshold || currentScrollY < 50) {
                    setIsVisible(true);
                }
            }
            // Reset scroll up distance and hide header when scrolling down
            else if (currentScrollY > lastScrollY && currentScrollY > 50) {
                setScrollUpDistance(0);
                setIsVisible(false);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', controlHeader);

        // Cleanup event listener
        return () => {
            window.removeEventListener('scroll', controlHeader);
        };
    }, [lastScrollY, scrollUpDistance]);

    return (
        <header style={headerStyle}>
            <div style={menuContainerStyle}>
                <DateSelection />
                <div style={searchStyle}>
                    <StationSearch />
                </div>
            </div>
        </header>
    );
};

export default Header;
