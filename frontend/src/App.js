import React, { Suspense, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { setCities } from './store/slices/citiesSlice';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import { fetchLatestWeatherStationsData, fetchGermanCities, findNearestStationsForCities } from './services/DataService';
import './App.css';

// Lazy load components
const D3MapView = React.lazy(() => import('./components/d3map/D3MapView'));
const HistoricalAnalysis = React.lazy(() => import('./components/analysis/HistoricalAnalysis'));
const ImpressumPage = React.lazy(() => import('./pages/ImpressumPage'));

// Create an AppContent component to use router hooks
function AppContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Handle redirect from error.html
    const params = new URLSearchParams(window.location.search);
    const redirectPath = params.get('redirect');
    if (redirectPath) {
      // Remove the query parameter and navigate to the correct path
      window.history.replaceState(null, '', redirectPath);
      // Actually navigate to the path using React Router
      navigate(redirectPath);
      return; // Skip data loading on initial redirect
    }

    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch weather stations data
        const stationsData = await fetchLatestWeatherStationsData();

        // Fetch cities data
        const citiesData = await fetchGermanCities();

        // Find nearest weather station for each city
        const citiesWithNearestStations = findNearestStationsForCities(citiesData, stationsData);

        // Dispatch cities to Redux store
        store.dispatch(setCities(citiesWithNearestStations));
      } catch (error) {
        console.error("Failed to load data:", error);
        setError("Failed to load data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  const MainPage = () => (
    <>
      <div>
        <Suspense fallback={<div className="loading-container">Loading map data...</div>}>
          {!loading && !error && <D3MapView />}
          {error && <div className="error-container">{error}</div>}
        </Suspense>
      </div>

      <div>
        <Suspense fallback={<div className="loading-container">Loading analysis data...</div>}>
          <HistoricalAnalysis />
        </Suspense>
      </div>
    </>
  );

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