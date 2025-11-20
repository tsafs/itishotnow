import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StationSearch from '../search/StationSearch.js';
import DateSelection from '../dateSelection/DateSelection.js';
import './Header.css';

const Header = () => {
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [scrollUpDistance, setScrollUpDistance] = useState(0);
    const scrollUpThreshold = 100;

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
        <header className={`site-header ${isVisible ? 'visible' : 'hidden'}`}>
            <div className="header-container">
                <Link to="/">
                    <h1 className="site-title">Ist es jetzt wirklich&nbsp;warm?</h1>
                </Link>
                <div className="menu-container">
                    <div className="header-date-selection">
                        <DateSelection />
                    </div>
                    <div className="header-search">
                        <StationSearch />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
