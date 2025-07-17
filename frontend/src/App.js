import React, { Suspense, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store } from './store';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import { mapCitiesToClosestWeatherStations } from './services/CityService';
import { PREDEFINED_CITIES } from './constants/map';

import { fetchHistoricalData, selectHistoricalDataStatus } from './store/slices/historicalDataSlice';
import { fetchHourlyData, selectInterpolatedHourlyDataStatus } from './store/slices/interpolatedHourlyDataSlice';
import { fetchLiveData, selectLiveData, selectLiveDataStatus } from './store/slices/liveDataSlice';
import { fetchCityData, selectCityRawData, selectCityDataStatus, setCityMappedData, selectCityMappedData } from './store/slices/cityDataSlice';
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

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [areCitiesMapped, setAreCitiesMapped] = useState(false);

    const liveData = useSelector(selectLiveData);
    const cityRawData = useSelector(selectCityRawData);
    const cityMappedData = useSelector(selectCityMappedData);
    const selectedCityId = useSelector(state => state.selectedCity.cityId);

    const liveDataStatus = useSelector(selectLiveDataStatus);
    const historicalDataStatus = useSelector(selectHistoricalDataStatus);
    const hourlyDataStatus = useSelector(selectInterpolatedHourlyDataStatus);
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
        const loadData = async () => {
            setLoading(true);
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
        if (liveDataStatus !== "succeeded" || cityDataStatus !== "succeeded" || areCitiesMapped) {
            return;
        }

        const result = mapCitiesToClosestWeatherStations(
            cityRawData,
            liveData,
        );

        dispatch(setCityMappedData(result));
        setAreCitiesMapped(true);
    }, [dispatch, liveData, liveDataStatus, cityRawData, cityDataStatus, areCitiesMapped]);

    // Set default city when cities are loaded
    useEffect(() => {
        if (selectedCityId || !cityMappedData) {
            return;
        }

        // Try to find the default city in the predefined list first
        const item = Object.values(cityMappedData).find(item =>
            PREDEFINED_CITIES.includes(item.city.cityName) &&
            item.city.cityName.toLowerCase().includes(DEFAULT_CITY));

        if (item) {
            dispatch(selectCity(item.city.cityId, true));
        }
    }, [cityMappedData, selectedCityId, dispatch]);

    // Check if all data is loaded and set loading state to false
    useEffect(() => {
        if (liveDataStatus !== "succeeded"
            || cityDataStatus !== "succeeded"
            || historicalDataStatus !== "succeeded"
            || hourlyDataStatus !== "succeeded"
            || !cityMappedData
        ) return;

        // If all data is loaded, set loading to false
        setLoading(false);
        setError(null);
    }, [
        liveDataStatus,
        cityDataStatus,
        historicalDataStatus,
        hourlyDataStatus,
        cityMappedData
    ]);

    const MainPage = React.useMemo(() => {
        return () => (
            <>
                <Suspense fallback={<div className="loading-container">Loading map data...</div>}>
                    {!loading && !error &&
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
    }, [loading, error]);

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