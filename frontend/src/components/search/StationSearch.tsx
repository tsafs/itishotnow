import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import { PREDEFINED_CITIES } from '../../constants/map.js';
import { selectCity } from '../../store/slices/selectedCitySlice.js';
import { selectCities, selectAreCitiesCorrelated } from '../../store/slices/cityDataSlice.js';
import { selectLiveData } from '../../store/slices/liveDataSlice.js';
import './StationSearch.css';

const StationSearch = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const cities = useSelector(selectCities);
    const areCitiesCorrelated = useSelector(selectAreCitiesCorrelated);
    const liveData = useSelector(selectLiveData);
    const selectedCityId = useSelector(state => state.selectedCity.cityId);

    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [filteredCities, setFilteredCities] = useState([]);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const searchRef = useRef(null);
    const inputRef = useRef(null);

    // Handle city selection
    const handleCitySelect = (city) => {
        const isPredefined = PREDEFINED_CITIES.includes(city.name);
        dispatch(selectCity(city.id, isPredefined));
        setSearchTerm('');
        setIsDropdownOpen(false);
        navigate('/'); // Navigate to home page when a city is selected
    };

    // Handle clicks outside of the dropdown to close it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
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

        // Only do exact matches (includes)
        let filtered = Object.values(cities).filter(city =>
            city.name.toLowerCase().includes(searchTermLower)
        );

        // Sort results by name length (shorter names first)
        filtered.sort((a, b) => a.name.length - b.name.length);

        // Limit to 15 results
        setFilteredCities(filtered.slice(0, 15));
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
                                const data = liveData[city.stationId];
                                if (!data) return <></>;

                                // Only show temperature if city has a nearest station with data
                                const hasTemperature = data.temperature !== undefined;

                                const isSelected = city.id === selectedCityId

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
