import { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaCalendarDay } from 'react-icons/fa';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { setDateAndFetchHistoricalData } from '../../store/slices/selectedDateSlice.js'
import { getNow } from '../../utils/dateUtils.js';
import { useHistoricalDailyDataDateRangeForStation } from '../../store/slices/historicalDataForStationSlice.js';
import { useSelectedItem } from '../../store/hooks/selectedItemHook.js';
import { useSelectedDate } from '../../store/slices/selectedDateSlice.js';
import './DateSelection.css';
import { DateTime } from 'luxon'; // Added Luxon

/**
 * Component for selecting "Yesterday", "Today", or an arbitrary date of a preconfigured selection of years.
 */

const convertYYYYMMDDToDate = (dateString) => {
    // Returns a Luxon DateTime object
    return DateTime.fromFormat(dateString, 'yyyyLLdd');
}

const DateSelection = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const selectedDate = useSelectedDate();
    const selectedItem = useSelectedItem();
    const dateRange = useHistoricalDailyDataDateRangeForStation(selectedItem?.station.id);

    const [isYesterdaySelected, setIsYesterdaySelected] = useState(false);
    const [isTodaySelected, setIsTodaySelected] = useState(true);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [recentlyClosed, setRecentlyClosed] = useState(false);
    const [renderYesterdayButton, setRenderYesterdayButton] = useState(false);

    const [startMonth, setStartMonth] = useState(null);
    const [endMonth, setEndMonth] = useState(null);
    const [disabledBefore, setDisabledBefore] = useState(null);
    const [disabledAfter, setDisabledAfter] = useState(null);

    const dateSelectRef = useRef(null);

    useEffect(() => {
        if (!dateRange) return;

        // Calculate yesterday's date using Luxon
        const yesterday = getNow().minus({ days: 1 });

        // Convert to YYYYMMDD format as string
        const yesterdayFormatted = yesterday.toFormat('yyyyLLdd');

        // Check if yesterday is within the historical date range (using string comparison)
        const isWithinRange =
            dateRange.from <= yesterdayFormatted &&
            dateRange.to >= yesterdayFormatted;

        setStartMonth(convertYYYYMMDDToDate(dateRange.from).toJSDate());
        setEndMonth(convertYYYYMMDDToDate(dateRange.to).toJSDate());
        setDisabledBefore(convertYYYYMMDDToDate(dateRange.from).toJSDate());
        setDisabledAfter(convertYYYYMMDDToDate(dateRange.to).toJSDate());

        setRenderYesterdayButton(isWithinRange);
    }, [dateRange])

    const handleDateSelection = useCallback((date) => {
        // date is a Luxon DateTime
        dispatch(setDateAndFetchHistoricalData(date.toISO()));
    }, [dispatch]);

    // Handle today selection
    const handleTodayClick = () => {
        const today = getNow();

        if (today.hasSame(DateTime.fromISO(selectedDate), 'day')) {
            return;
        }

        handleDateSelection(today);
        if (window.location.pathname !== '/') {
            navigate('/');
        }
    };

    // Handle yesterday selection
    const handleYesterdayClick = () => {
        const yesterday = getNow().minus({ days: 1 });
        handleDateSelection(yesterday);
        if (window.location.pathname !== '/') {
            navigate('/');
        }
    };

    const handleDateSelect = (date) => {
        // date is a JS Date from DayPicker, convert to Luxon
        if (!date) {
            setIsCalendarOpen(false);
            return;
        }
        const selected = DateTime.fromJSDate(date).setZone('Europe/Berlin');
        const today = getNow();

        if (selected.hasSame(DateTime.fromISO(selectedDate), 'day')) {
            setIsCalendarOpen(false);
            return;
        }

        if (selected.hasSame(today, 'day')) {
            setIsCalendarOpen(false);
            handleTodayClick();
            return;
        }
        const yesterday = today.minus({ days: 1 });
        if (selected.hasSame(yesterday, 'day')) {
            setIsCalendarOpen(false);
            handleYesterdayClick();
            return;
        }
        handleDateSelection(selected);
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
            const selected = DateTime.fromISO(selectedDate);
            const today = getNow();
            const yesterday = today.minus({ days: 1 });
            setIsTodaySelected(selected.hasSame(today, 'day'));
            setIsYesterdaySelected(selected.hasSame(yesterday, 'day'));
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
                }, 500);
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
                {renderYesterdayButton && (
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

                <div
                    className={`calendar-icon-container ${!isYesterdaySelected && !isTodaySelected ? 'active' : ''}`}
                    onClick={toggleCalendar}>
                    <FaCalendarDay className={`date-select-icon ${isCalendarOpen ? 'active' : ''}`} />
                </div>
            </div>

            {isCalendarOpen && startMonth && endMonth && disabledBefore && disabledAfter && (
                <div ref={dateSelectRef} className="date-picker-popup">
                    <DayPicker
                        mode="single"
                        selected={selectedDate ? DateTime.fromISO(selectedDate).toJSDate() : undefined}
                        onSelect={handleDateSelect}
                        startMonth={startMonth}
                        endMonth={endMonth}
                        disabled={{ before: disabledBefore, after: disabledAfter }}
                        navLayout='around'
                        showOutsideDays
                    />
                </div>
            )}
        </div>
    );
};

export default DateSelection;