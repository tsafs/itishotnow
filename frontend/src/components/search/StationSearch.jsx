import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import { PREDEFINED_CITIES } from '../../constants/map';
import { selectCity } from '../../store/slices/rememberedCitiesSlice';
import './StationSearch.css';

/**
 * Component for searching cities and finding their closest weather stations
 */

// Helper function to check if two cities are the same
const isSameCity = (city1, city2) => {
    if (!city1 || !city2) return false;
    return city1.city_name === city2.city_name &&
        city1.lat === city2.lat &&
        city1.lon === city2.lon;
};

const StationSearch = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const cities = useSelector(state => state.cities);
    const selectedCity = useSelector(state => state.selectedCity);

    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [filteredCities, setFilteredCities] = useState([]);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const searchRef = useRef(null);
    const inputRef = useRef(null);

    // Handle city selection
    const handleCitySelect = (city) => {
        const isPredefined = PREDEFINED_CITIES.includes(city.city_name);
        dispatch(selectCity(city, isPredefined));
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
        if (!searchTerm.trim()) {
            setFilteredCities([]);
            return;
        }

        const searchTermLower = searchTerm.toLowerCase();

        // Only do exact matches (includes)
        let filtered = cities.filter(city =>
            city.city_name.toLowerCase().includes(searchTermLower)
        );

        // Sort results by name length (shorter names first)
        filtered.sort((a, b) => a.city_name.length - b.city_name.length);

        // Limit to 15 results
        setFilteredCities(filtered.slice(0, 15));
    }, [searchTerm, cities]);

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

                {isDropdownOpen && searchTerm && (
                    <div className="station-search-dropdown">
                        {filteredCities.length > 0 ? (
                            filteredCities.map((city, index) => {
                                // Only show temperature if city has a nearest station with data
                                const hasTemperature = city.nearestStation &&
                                    city.nearestStation.temperature !== undefined;

                                const isSelected = isSameCity(selectedCity, city);

                                return (
                                    <div
                                        key={`${city.city_name}-${city.lat}-${city.lon}-${index}`}
                                        onClick={() => handleCitySelect(city)}
                                        className={`station-search-item ${isSelected ?
                                            'station-search-item-selected' : ''} ${focusedIndex === index ? 'station-search-item-focused' : ''}`}
                                        title={`${city.city_name}${hasTemperature ? `: ${city.nearestStation.temperature.toFixed(1)}°C` : ''}`}
                                    >
                                        <span>{city.city_name}</span>
                                        <span className="station-search-item-temperature">
                                            {hasTemperature ?
                                                `${city.nearestStation.temperature.toFixed(1)}°C` : ''}
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
