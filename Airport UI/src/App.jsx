import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';

const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const AnalysisSetupPage = React.lazy(() => import('./pages/AnalysisSetupPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));

const PageLoader = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh', width: '100vw', background: '#08131F',
    flexDirection: 'column', gap: '16px',
  }}>
    <div style={{
      width: '48px', height: '48px', border: '3px solid rgba(0,245,255,0.1)',
      borderTop: '3px solid #00f5ff', borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
    <span style={{ color: '#64748b', fontFamily: 'monospace', fontSize: '12px', letterSpacing: '0.1em' }}>
      LOADING...
    </span>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/setup" element={<AnalysisSetupPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
