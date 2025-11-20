import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import { PREDEFINED_CITIES } from '../../constants/map.js';
import { selectCity } from '../../store/slices/selectedCitySlice.js';
import { selectCities, selectAreCitiesCorrelated } from '../../store/slices/cityDataSlice.js';
import { selectLiveData } from '../../store/slices/liveDataSlice.js';
import './StationSearch.css';
import { useAppSelector } from '../../store/hooks/useAppSelector.js';
import { useAppDispatch } from '../../store/hooks/useAppDispatch.js';
import type { ICity } from '../../classes/City.js';
import type StationData from '../../classes/StationData.js';

const StationSearch = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const cities = useAppSelector(selectCities);
    const areCitiesCorrelated = useAppSelector(selectAreCitiesCorrelated);
    const liveData = useAppSelector(selectLiveData);
    const selectedCityId = useAppSelector(state => state.selectedCity.cityId);

    const [searchTerm, setSearchTerm] = useState<string>('');
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const [filteredCities, setFilteredCities] = useState<ICity[]>([]);
    const [focusedIndex, setFocusedIndex] = useState<number>(-1);
    const searchRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    // Handle city selection
    const handleCitySelect = useCallback((city: ICity) => {
        const isPredefined = PREDEFINED_CITIES.includes(city.name);
        dispatch(selectCity(city.id, isPredefined));
        setSearchTerm('');
        setIsDropdownOpen(false);
        navigate('/'); // Navigate to home page when a city is selected
    }, [dispatch, navigate]);

    // Handle clicks outside of the dropdown to close it
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && event.target instanceof Node && !searchRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Filter cities based on search term - no fuzzy search
    useEffect(() => {
        if (!areCitiesCorrelated) return;

        if (!searchTerm.trim()) {
            setFilteredCities([]);
            return;
        }

        const searchTermLower = searchTerm.toLowerCase();

        const filtered = Object.values(cities)
            .filter((city) => city.name.toLowerCase().includes(searchTermLower))
            .sort((a, b) => a.name.length - b.name.length)
            .slice(0, 15);

        setFilteredCities(filtered);
    }, [searchTerm, cities, areCitiesCorrelated]);

    // Reset focused index when filtered cities change
    useEffect(() => {
        setFocusedIndex(-1);
    }, [filteredCities]);

    return (
        <div ref={searchRef} className="station-search-container">
            <div className="station-search-input-container with-icon">
                <FaSearch className="station-search-icon" />
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Stadt suchen..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsDropdownOpen(true);
                    }}
                    onClick={() => setIsDropdownOpen(true)}
                    className="station-search-input"
                />

                {isDropdownOpen && searchTerm && liveData && areCitiesCorrelated && (
                    <div className="station-search-dropdown">
                        {filteredCities.length > 0 ? (
                            filteredCities.map((city, index) => {
                                const data: StationData | undefined = liveData[city.stationId!];
                                if (!data) return null;

                                // Only show temperature if city has a nearest station with data
                                const hasTemperature = data.temperature !== undefined;

                                const isSelected = city.id === selectedCityId;

                                return (
                                    <div
                                        key={city.id}
                                        onClick={() => handleCitySelect(city)}
                                        className={`station-search-item ${isSelected ?
                                            'station-search-item-selected' : ''} ${focusedIndex === index ? 'station-search-item-focused' : ''}`}
                                        title={`${city.name}${hasTemperature ? `: ${data.temperature.toFixed(1)}°C` : ''}`}
                                    >
                                        <span>{city.name}</span>
                                        <span className="station-search-item-temperature">
                                            {hasTemperature ?
                                                `${data.temperature.toFixed(1)}°C` : ''}
                                        </span>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="station-search-item">
                                Keine Städte gefunden
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StationSearch;
