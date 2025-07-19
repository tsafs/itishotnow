import React, { Suspense, useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store } from './store';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import { findClosestWeatherStationsForCities } from './services/CityService';
import { PREDEFINED_CITIES } from './constants/map';
import { fetchHistoricalData } from './store/slices/historicalDataSlice';
import { fetchHourlyData } from './store/slices/interpolatedHourlyDataSlice';
import { fetchLiveData, selectLiveDataStatus } from './store/slices/liveDataSlice';
import { fetchCityData, selectCities, selectAreCitiesCorrelated, selectCityDataStatus, setCities } from './store/slices/cityDataSlice';
import { selectCity } from './store/slices/selectedCitySlice';

import './App.css';
import { getNow } from './utils/dateUtils';

// Lazy load components
const D3MapView = React.lazy(() => import('./components/d3map/D3MapView'));
const HistoricalAnalysis = React.lazy(() => import('./components/analysis/HistoricalAnalysis'));
const ImpressumPage = React.lazy(() => import('./pages/ImpressumPage'));
const Closing = React.lazy(() => import('./components/closing/Closing'));

const DEFAULT_CITY = "berlin"; // Default city to select

function AppContent() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [error, setError] = useState(null);
    const didFetchDataRef = useRef(false);

    const stations = useSelector(state => state.stations.stations);
    const cities = useSelector(selectCities);
    const areCitiesCorrelated = useSelector(selectAreCitiesCorrelated);
    const selectedCityId = useSelector(state => state.selectedCity.cityId);

    const liveDataStatus = useSelector(selectLiveDataStatus);
    const cityDataStatus = useSelector(selectCityDataStatus);

    // Handle redirect from error.html
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const redirectPath = params.get('redirect');
        if (redirectPath) {
            window.history.replaceState(null, '', redirectPath);
            navigate(redirectPath);
        }
    }, [navigate]);

    useEffect(() => {
        if (didFetchDataRef.current) return;

        didFetchDataRef.current = true;

        const loadData = async () => {
            try {
                // Get today's date for historical data
                const today = getNow();
                const month = today.getMonth() + 1; // JavaScript months are 0-indexed
                const day = today.getDate();

                // Load weather stations and cities data
                await Promise.all([
                    dispatch(fetchLiveData()),
                    dispatch(fetchCityData()),
                    dispatch(fetchHistoricalData({ month, day })),
                    dispatch(fetchHourlyData({ month, day }))
                ]);
            } catch (error) {
                console.error("Failed to load data:", error);
                setError("Failed to load data. Please try again later.");
            }
        };

        loadData();
    }, [dispatch]);

    useEffect(() => {
        if (liveDataStatus !== "succeeded" || cityDataStatus !== "succeeded" || areCitiesCorrelated) {
            return;
        }
        const correlatedCities = findClosestWeatherStationsForCities(
            cities,
            stations,
        );

        const serialized = {}
        for (const [id, city] of Object.entries(correlatedCities)) { 
            serialized[id] = city.toJSON();
        }
        dispatch(setCities(serialized));
    }, [dispatch, stations, liveDataStatus, cities, cityDataStatus, areCitiesCorrelated]);

    // Set default city when cities are loaded
    useEffect(() => {
        if (selectedCityId || areCitiesCorrelated) {
            return;
        }

        // Try to find the default city in the predefined list first
        const city = Object.values(cities).find(city =>
            PREDEFINED_CITIES.includes(city.name) &&
            city.name.toLowerCase().includes(DEFAULT_CITY));

        if (city) {
            dispatch(selectCity(city.id, true));
        }
    }, [cities, selectedCityId, areCitiesCorrelated, dispatch]);

    const MainPage = React.useMemo(() => {
        return () => (
            <>
                <Suspense fallback={<div className="loading-container">Loading map data...</div>}>
                    {!error &&
                        <>
                            <D3MapView />
                            <HistoricalAnalysis />
                        </>
                    }
                    {error && <div className="error-container">{error}</div>}
                </Suspense>
                <Closing />
            </>
        );
    }, [error]);

    return (
        <div className="app-container">
            <Header />
            <main className="content-wrapper">
                <Routes>
                    <Route path="/" element={<MainPage />} />
                    <Route path="/impressum" element={
                        <Suspense fallback={<div className="loading-container">Loading...</div>}>
                            <ImpressumPage />
                        </Suspense>
                    } />
                    {/* Redirect any other routes to home */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
            <Footer />
        </div>
    );
}

// Main App component that provides the Router context
function App() {
    return (
        <Provider store={store}>
            <BrowserRouter>
                <AppContent />
            </BrowserRouter>
        </Provider>
    );
}

export default App;