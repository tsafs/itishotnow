import { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaCalendarDay } from 'react-icons/fa';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { selectDate } from '../../store/slices/selectedDateSlice'
import { getNow } from '../../utils/dateUtils';
// import { updateDataByDate } from '../../store/slices/weatherStationDataSlice';
import { useHistoricalDailyDataDateRangeForStation } from '../../store/slices/historicalDataForStationSlice';
import { useSelectedItem } from '../../store/hooks/selectedItemHook';
import { useSelectedDate } from '../../store/slices/selectedDateSlice';
import './DateSelection.css';

/**
 * Component for selecting "Yesterday", "Today", or an arbitrary date of a preconfigured selection of years.
 */

// Datepicker shows dates from 2025 to the current year^
const FROM_YEAR = 2025;

const DateSelection = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const selectedDate = useSelectedDate();;
    const selectedItem = useSelectedItem();
    const historicalDateRange = useHistoricalDailyDataDateRangeForStation(selectedItem?.station.id);

    const [isYesterdaySelected, setIsYesterdaySelected] = useState(false);
    const [isTodaySelected, setIsTodaySelected] = useState(true);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [recentlyClosed, setRecentlyClosed] = useState(false);
    const [isYesterdayRendered, setIsYesterdayRendered] = useState(false);
    const dateSelectRef = useRef(null);

    useEffect(() => {
        if (!historicalDateRange) return;

        // Calculate yesterday's date
        const yesterday = getNow();
        yesterday.setDate(yesterday.getDate() - 1);

        // Convert to YYYYMMDD format as string
        const yesterdayFormatted = yesterday.toISOString().slice(0, 10).replace(/-/g, '');

        // Check if yesterday is within the historical date range (using string comparison)
        const isWithinRange =
            historicalDateRange.from <= yesterdayFormatted &&
            historicalDateRange.to >= yesterdayFormatted;

        setIsYesterdayRendered(isWithinRange);
    }, [historicalDateRange])

    const handleDateSelection = useCallback((date) => {
        console.log(`Selected date: ${date.toISOString()}`);
        dispatch(selectDate(date.toISOString()));

        // If there's a selected city, update its climate data based on the new date
        if (selectedItem?.station.id) {
            console.log(`Updating data for station ${selectedItem.station.id} on date ${date.toISOString()}`);
            // dispatch(updateDataByDate(selectedItem.station.id, date.toISOString()));
        }
    }, [dispatch, selectedItem]);

    // Handle today selection
    const handleTodayClick = () => {
        const today = getNow();
        handleDateSelection(today);
        if (window.location.pathname !== '/') {
            navigate('/');
        }
    };

    // Handle yesterday selection
    const handleYesterdayClick = () => {
        const yesterday = getNow();
        yesterday.setDate(yesterday.getDate() - 1);
        handleDateSelection(yesterday);
        if (window.location.pathname !== '/') {
            navigate('/');
        }
    };

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

        handleDateSelection(date);
        setIsCalendarOpen(false);
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
                {isYesterdayRendered && (
                    <div
                        className={`date-toggle-button ${isYesterdaySelected ? 'active' : ''}`}
                        onClick={handleYesterdayClick}
                    >
                        Gestern
                    </div>)
                }

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
                        endMonth={getNow()}
                        disabled={{ after: getNow() }}
                        navLayout='around'
                        showOutsideDays
                    />
                </div>
            )}
        </div>
    );
};

export default DateSelection;