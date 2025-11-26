import React, { Suspense, useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import { PREDEFINED_CITIES } from './constants/map';
import { fetchYearlyMeanByDay } from './store/slices/YearlyMeanByDaySlice';
import { fetchReferenceYearlyHourlyInterpolatedByDay } from './store/slices/ReferenceYearlyHourlyInterpolatedByDaySlice';
import { fetchLiveData, selectLiveDataStatus, selectStationsJSON } from './store/slices/liveDataSlice';
import { fetchCityData, selectCities, selectCityDataStatus } from './store/slices/cityDataSlice';
import { selectCity } from './store/slices/selectedCitySlice';
import { fetchDailyDataForStation } from './store/slices/historicalDataForStationSlice';
import { fetchStationDateRange } from './store/slices/stationDateRangesSlice';

import './App.css';
import { getNow } from './utils/dateUtils';
import { useAppSelector } from './store/hooks/useAppSelector';
import { useAppDispatch } from './store/hooks/useAppDispatch';

// Plot registry-based lazy loading
import { plots } from './components/plots/registry';
const ImpressumPage = React.lazy(() => import('./pages/ImpressumPage'));
const Closing = React.lazy(() => import('./components/closing/Closing'));

const DEFAULT_CITY = "berlin"; // Default city to select

function AppContent() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const [error, setError] = useState<string | null>(null);
    const didFetchDataRef = useRef(false);

    const stationsJSON = useAppSelector(selectStationsJSON);
    const cities = useAppSelector(selectCities);
    const selectedCityId = useAppSelector(state => state.selectedCity.cityId);

    const liveDataStatus = useAppSelector(selectLiveDataStatus);
    const cityDataStatus = useAppSelector(selectCityDataStatus);

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
                const month = today.month;
                const day = today.day;

                // Load weather stations first, then cities (which need stations)
                await dispatch(fetchLiveData()).unwrap();

                // Now load cities with stations and historical data in parallel
                const stations = store.getState().liveData.data?.stations;
                if (stations) {
                    await Promise.all([
                        dispatch(fetchCityData({ stations })),
                        dispatch(fetchYearlyMeanByDay({ month, day })),
                        dispatch(fetchReferenceYearlyHourlyInterpolatedByDay({ month, day }))
                    ]);
                }
            } catch (error) {
                console.error("Failed to load data:", error);
                setError("Failed to load data. Please try again later.");
            }
        };

        loadData();
    }, [dispatch]);

    // Correlation is now built into fetchCityData - no separate effect needed

    // Set default city when cities are loaded
    useEffect(() => {
        if (selectedCityId || !cities) {
            return;
        }

        // Try to find the default city in the predefined list first
        const city = Object.values(cities).find(city =>
            PREDEFINED_CITIES.includes(city.name) &&
            city.name.toLowerCase().includes(DEFAULT_CITY));

        if (city) {
            dispatch(selectCity(city.id, true));
        }
    }, [cities, selectedCityId, dispatch]);

    // Load DilyRecentByStation data when a city is selected
    useEffect(() => {
        if (!selectedCityId || cityDataStatus !== 'succeeded') return;

        const city = cities[selectedCityId];
        if (!city) return;

        const stationId = city.stationId;
        if (!stationId || !stationsJSON) {
            return;
        }
        const station = stationsJSON[stationId];
        if (!station) return;

        // Fetch both historical data and date range for the station
        dispatch(fetchDailyDataForStation({ stationId: station.id }));
        dispatch(fetchStationDateRange({ stationId: station.id }));
    }, [dispatch, selectedCityId, cityDataStatus, cities, stationsJSON]);

    const LazyEntries = React.useMemo(() => {
        return plots.map(p => ({ ...p, Comp: React.lazy(p.loader) }));
    }, []);

    const MainPage = React.useMemo(() => {
        return () => (
            <>
                <Suspense fallback={<div className="loading-container">Loading map data...</div>}>
                    {!error && (
                        <>
                            {LazyEntries.map(entry => {
                                const Comp = entry.Comp;
                                return <Comp key={entry.id} />;
                            })}
                        </>
                    )}
                    {error && <div className="error-container">{error}</div>}
                </Suspense>
                <Closing />
            </>
        );
    }, [error, LazyEntries]);

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