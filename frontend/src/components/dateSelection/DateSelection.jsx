import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaCalendarDay } from 'react-icons/fa';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { selectDate } from '../../store/slices/selectedDateSlice'
import { getNow } from '../../utils/dateUtils';
import './DateSelection.css';

/**
 * Component for selecting "Yesterday", "Today", or an arbitrary date of a preconfigured selection of years.
 */

// Datepicker shows dates from 2025 to the current year^
const FROM_YEAR = 2025;

const DateSelection = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const selectedDate = useSelector(state => state.selectedDate);

    const [isYesterdaySelected, setIsYesterdaySelected] = useState(false);
    const [isTodaySelected, setIsTodaySelected] = useState(true);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [recentlyClosed, setRecentlyClosed] = useState(false);
    const dateSelectRef = useRef(null);

    const handleDateSelect = (date) => {
        if (!date) {
            setIsCalendarOpen(false);
            return;
        }

        // If the date is today or yesterday, set the respective state
        const today = getNow();
        if (date.toDateString() === today.toDateString()) {
            setIsCalendarOpen(false);
            handleTodayClick();
            return;
        }

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            setIsCalendarOpen(false);
            handleYesterdayClick();
            return;
        }

        dispatch(selectDate(date.toISOString()));
        // setIsYesterdaySelected(false);
        // setIsTodaySelected(false);
        setIsCalendarOpen(false);
        if (window.location.pathname !== '/') {
            navigate('/'); // Navigate to home page when a date is selected
        }
    };

    // Handle today selection
    const handleTodayClick = () => {
        const today = getNow();
        dispatch(selectDate(today.toISOString()));
        // setIsTodaySelected(true);
        // setIsYesterdaySelected(false);
        if (window.location.pathname !== '/') {
            navigate('/');
        }
    };

    // Handle yesterday selection
    const handleYesterdayClick = () => {
        const yesterday = getNow();
        yesterday.setDate(yesterday.getDate() - 1);
        dispatch(selectDate(yesterday.toISOString()));
        // setIsYesterdaySelected(true);
        // setIsTodaySelected(false);
        if (window.location.pathname !== '/') {
            navigate('/');
        }
    };

    // Handle calendar icon click
    const toggleCalendar = () => {
        // Don't open if it was recently closed
        if (recentlyClosed && !isCalendarOpen) {
            return;
        }

        setIsCalendarOpen(!isCalendarOpen);
    };

    useEffect(() => {
        // Set state of buttons based on selected date
        if (selectedDate) {
            const selected = new Date(selectedDate);
            const today = getNow();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            setIsTodaySelected(selected.toDateString() === today.toDateString());
            setIsYesterdaySelected(selected.toDateString() === yesterday.toDateString());
        } else {
            setIsTodaySelected(false);
            setIsYesterdaySelected(false);
        }
    }, [selectedDate]);

    // Handle clicks outside of the calendar to close it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dateSelectRef.current && !dateSelectRef.current.contains(event.target)) {
                setIsCalendarOpen(false);
                setRecentlyClosed(true);
                setTimeout(() => {
                    setRecentlyClosed(false);
                }, 50);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="date-select-container">
            <div className="date-selection-row">
                <div
                    className={`date-toggle-button ${isYesterdaySelected ? 'active' : ''}`}
                    onClick={handleYesterdayClick}
                >
                    Gestern
                </div>

                <div
                    className={`date-toggle-button ${isTodaySelected ? 'active' : ''}`}
                    onClick={handleTodayClick}
                >
                    Heute
                </div>

                <div className={`calendar-icon-container ${!isYesterdaySelected && !isTodaySelected ? 'active' : ''}`} onClick={toggleCalendar}>
                    <FaCalendarDay className={`date-select-icon ${isCalendarOpen ? 'active' : ''}`} />
                </div>
            </div>

            {isCalendarOpen && (
                <div ref={dateSelectRef} className="date-picker-popup">
                    <DayPicker
                        mode="single"
                        selected={selectedDate ? new Date(selectedDate) : undefined}
                        onSelect={handleDateSelect}
                        startMonth={new Date(FROM_YEAR, 0)}
                        endMonth={new Date()}
                        disabled={{ after: new Date() }}
                        navLayout='around'
                        showOutsideDays
                    />
                </div>
            )}
        </div>
    );
};

export default DateSelection;