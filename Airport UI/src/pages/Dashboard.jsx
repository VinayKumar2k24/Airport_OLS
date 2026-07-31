import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TopNav } from '../components/TopNav';
import { PremiumSidebar } from '../components/PremiumSidebar';
import { PremiumGoogleMap } from '../components/PremiumGoogleMap';
import { AnalyticsCards } from '../components/AnalyticsCards';
import { PremiumCharts } from '../components/PremiumCharts';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { PremiumFooter } from '../components/PremiumFooter';
import { AnalysisTimeline } from '../components/AnalysisTimeline';
import {
  getAirports, getRunways, runAnalysis,
  getOLSSurfaces, getEncroachments,
  downloadCSV, downloadTXT, openGeoJSON, computeStats
} from '../api/airportApi';

const INITIAL_LAYERS = {
  olsSurfaces: true,
  encroachments: true,
  labels: true,
  satelliteView: true,
  terrainView: false,
  heatmap: false,
};

export const Dashboard = () => {
  const [airports, setAirports] = useState([]);
  const [loadingAirports, setLoadingAirports] = useState(true);
  const [selectedIcao, setSelectedIcao] = useState('');

  const [runways, setRunways] = useState([]);
  const [loadingRunways, setLoadingRunways] = useState(false);
  const [selectedRunway, setSelectedRunway] = useState('');

  // Satellite Date Selection State
  const [baselineFrom, setBaselineFrom] = useState('2020-01-01');
  const [baselineTo, setBaselineTo] = useState('2020-12-31');
  const [monitoringFrom, setMonitoringFrom] = useState('2023-01-01');
  const [monitoringTo, setMonitoringTo] = useState('2023-12-31');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStep, setAnalysisStep] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);

  const [layers, setLayers] = useState(INITIAL_LAYERS);
  const [olsOpacity, setOlsOpacity] = useState(0.08);
  const [olsGeoJson, setOlsGeoJson] = useState(null);
  const [encroachmentsGeoJson, setEncroachmentsGeoJson] = useState(null);
  const [stats, setStats] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [error, setError] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [successInfo, setSuccessInfo] = useState(null);
  const [backendConnected, setBackendConnected] = useState(true);

  const progressRef = useRef(null);

  // Validate Date Ranges
  useEffect(() => {
    if (baselineFrom && baselineTo && baselineFrom > baselineTo) {
      setValidationError('Baseline From Date must be <= Baseline To Date');
    } else if (monitoringFrom && monitoringTo && monitoringFrom > monitoringTo) {
      setValidationError('Monitoring From Date must be <= Monitoring To Date');
    } else {
      setValidationError(null);
    }
  }, [baselineFrom, baselineTo, monitoringFrom, monitoringTo]);

  // 1. Fetch Airports dynamically on mount
  useEffect(() => {
    let isMounted = true;
    const fetchAirportData = async () => {
      setLoadingAirports(true);
      try {
        const data = await getAirports();
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setAirports(data);
          const firstIcao = typeof data[0] === 'string' ? data[0] : (data[0].icao || data[0].ICAO);
          setSelectedIcao(firstIcao);
          setBackendConnected(true);
        }
      } catch (err) {
        console.error('Failed to load airports from backend:', err);
        if (isMounted) {
          setBackendConnected(false);
          setError('Backend server offline or failed to fetch airports CSV.');
        }
      } finally {
        if (isMounted) setLoadingAirports(false);
      }
    };

    fetchAirportData();
    return () => { isMounted = false; };
  }, []);

  // 2. Fetch Runways dynamically whenever selectedIcao changes
  useEffect(() => {
    if (!selectedIcao) return;
    let isMounted = true;
    const fetchRunwayData = async () => {
      setLoadingRunways(true);
      setRunways([]);
      setSelectedRunway('');
      setOlsGeoJson(null);
      setEncroachmentsGeoJson(null);
      setStats(null);
      try {
        const data = await getRunways(selectedIcao);
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setRunways(data);
          setSelectedRunway(data[0]); // Exact string from CSV
        }
      } catch (err) {
        console.error(`Failed to load runways for ${selectedIcao}:`, err);
        if (isMounted) {
          setError(`Failed to fetch runways for airport ${selectedIcao}`);
        }
      } finally {
        if (isMounted) setLoadingRunways(false);
      }
    };

    fetchRunwayData();
    return () => { isMounted = false; };
  }, [selectedIcao]);

  const handleSelectAirport = useCallback((icao) => {
    setSelectedIcao(icao);
    setError(null);
    setSuccessInfo(null);
  }, []);

  const handleToggleLayer = useCallback((key) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const addToTimeline = useCallback((entry) => {
    setTimeline(prev => [entry, ...prev].slice(0, 10));
  }, []);

  const simulateProgress = () => {
    setAnalysisProgress(5);
    setAnalysisStep('Calculating Spatial Anchor...');
    const steps = [
      { progress: 15, msg: 'Calculating Spatial Anchor...' },
      { progress: 30, msg: 'Generating OLS Surfaces...' },
      { progress: 48, msg: 'Downloading Satellite Imagery...' },
      { progress: 65, msg: 'Running Change Detection...' },
      { progress: 82, msg: 'Performing Spatial Analytics...' },
      { progress: 95, msg: 'Generating Encroachment Report...' },
    ];
    let i = 0;
    progressRef.current = setInterval(() => {
      if (i < steps.length) {
        setAnalysisProgress(steps[i].progress);
        setAnalysisStep(steps[i].msg);
        i++;
      } else {
        clearInterval(progressRef.current);
      }
    }, 1000);
  };

  const handleAnalyze = useCallback(async () => {
    if (!selectedIcao || !selectedRunway) {
      setError('Please select an Airport and Runway.');
      return;
    }
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setSuccessInfo(null);
    setOlsGeoJson(null);
    setEncroachmentsGeoJson(null);
    setStats(null);
    simulateProgress();

    const timeEntry = {
      icao: selectedIcao,
      runway: selectedRunway,
      time: new Date().toLocaleTimeString(),
      status: 'running',
      message: 'Processing...',
    };
    addToTimeline(timeEntry);

    try {
      const payload = {
        airport_icao: selectedIcao,
        runway_name: selectedRunway,
        baseline: {
          from_date: baselineFrom,
          to_date: baselineTo,
        },
        monitoring: {
          from_date: monitoringFrom,
          to_date: monitoringTo,
        },
      };

      const result = await runAnalysis(payload);

      const [ols, enc] = await Promise.all([
        getOLSSurfaces(selectedIcao).catch(() => null),
        getEncroachments(selectedIcao).catch(() => null),
      ]);

      setOlsGeoJson(ols);
      setEncroachmentsGeoJson(enc);
      if (enc) setStats(computeStats(enc));
      setAnalysisProgress(100);

      setSuccessInfo({
        airport: selectedIcao,
        runway: selectedRunway,
        baseline: `${baselineFrom} to ${baselineTo}`,
        monitoring: `${monitoringFrom} to ${monitoringTo}`,
        message: result?.message || 'Analysis Completed Successfully',
      });

      addToTimeline({
        icao: selectedIcao,
        runway: selectedRunway,
        time: new Date().toLocaleTimeString(),
        status: 'success',
        message: `Analysis complete. Baseline: ${baselineFrom} to ${baselineTo}, Monitoring: ${monitoringFrom} to ${monitoringTo}`,
      });
    } catch (err) {
      console.error('Analysis Error:', err);
      const backendErr = err.response?.data?.detail || err.response?.data?.message || err.message || 'Analysis execution failed.';
      setError(backendErr);

      addToTimeline({
        icao: selectedIcao,
        runway: selectedRunway,
        time: new Date().toLocaleTimeString(),
        status: 'error',
        message: backendErr,
      });
    } finally {
      clearInterval(progressRef.current);
      setTimeout(() => {
        setIsAnalyzing(false);
        setAnalysisProgress(0);
        setAnalysisStep('');
      }, 800);
    }
  }, [selectedIcao, selectedRunway, baselineFrom, baselineTo, monitoringFrom, monitoringTo, validationError, addToTimeline]);

  const hasData = !!(olsGeoJson || encroachmentsGeoJson);

  return (
    <div className="flex flex-col h-screen w-screen bg-navy-950 overflow-hidden">
      {/* Loading Overlay during analysis */}
      <LoadingOverlay
        isVisible={isAnalyzing}
        progress={analysisProgress}
        status={analysisStep || `Analyzing ${selectedIcao} Runway ${selectedRunway}`}
      />

      {/* Top Navigation */}
      <TopNav
        selectedIcao={selectedIcao}
        selectedRunway={selectedRunway}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(p => !p)}
        backendConnected={backendConnected}
      />

      {/* Main 3-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar — 20% */}
        <PremiumSidebar
          airports={airports}
          loadingAirports={loadingAirports}
          selectedIcao={selectedIcao}
          onSelectAirport={handleSelectAirport}
          runways={runways}
          loadingRunways={loadingRunways}
          selectedRunway={selectedRunway}
          onSelectRunway={setSelectedRunway}
          baselineFrom={baselineFrom}
          setBaselineFrom={setBaselineFrom}
          baselineTo={baselineTo}
          setBaselineTo={setBaselineTo}
          monitoringFrom={monitoringFrom}
          setMonitoringFrom={setMonitoringFrom}
          monitoringTo={monitoringTo}
          setMonitoringTo={setMonitoringTo}
          onAnalyze={handleAnalyze}
          isAnalyzing={isAnalyzing}
          validationError={validationError}
          layers={layers}
          onToggleLayer={handleToggleLayer}
          olsOpacity={olsOpacity}
          onChangeOpacity={setOlsOpacity}
          hasData={hasData}
          onDownloadTXT={() => downloadTXT(selectedIcao)}
          onDownloadCSV={() => downloadCSV(selectedIcao)}
          onOpenGeoJSON={() => openGeoJSON(selectedIcao)}
        />

        {/* Center Panel — Google Map — ~55% */}
        <div className="flex-1 relative overflow-hidden border-x border-cyan-500/5">
          <PremiumGoogleMap
            selectedIcao={selectedIcao}
            selectedRunway={selectedRunway}
            olsGeoJson={olsGeoJson}
            encroachmentsGeoJson={encroachmentsGeoJson}
            layers={layers}
            olsOpacity={olsOpacity}
            onToggleSatellite={() => handleToggleLayer('satelliteView')}
          />

          {/* Success Banner / Modal */}
          <AnimatePresence>
            {successInfo && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex flex-col gap-2 px-5 py-3.5 rounded-xl glass-card border border-emerald-500/40 shadow-neon-cyan max-w-md w-full"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                      Analysis Completed Successfully
                    </span>
                  </div>
                  <button onClick={() => setSuccessInfo(null)} className="text-slate-400 hover:text-white text-sm font-bold">×</button>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[10px] text-slate-300 mt-1">
                  <div><span className="text-slate-500">Airport:</span> <span className="text-cyan-300 font-bold">{successInfo.airport}</span></div>
                  <div><span className="text-slate-500">Runway:</span> <span className="text-blue-300 font-bold">{successInfo.runway}</span></div>
                  <div><span className="text-slate-500">Baseline Range:</span> <span className="text-slate-200">{successInfo.baseline}</span></div>
                  <div><span className="text-slate-500">Monitoring Range:</span> <span className="text-slate-200">{successInfo.monitoring}</span></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toast / Error Alert */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-red-950/90 border border-red-500/40 text-red-300 text-xs font-medium backdrop-blur-sm shadow-glass max-w-lg"
              >
                <span className="text-red-400 shrink-0">⚠</span>
                <span className="flex-1 truncate">{error}</span>
                <button onClick={() => setError(null)} className="ml-2 text-red-500 hover:text-red-300 font-bold">×</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Map status bar at bottom */}
          {hasData && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-0 left-0 right-0 h-8 glass-dark border-t border-cyan-500/5 flex items-center px-3 gap-4 z-10"
            >
              {olsGeoJson && (
                <span className="text-[9px] font-mono text-cyan-400/70">
                  OLS: {olsGeoJson.features?.length || 0} surfaces loaded
                </span>
              )}
              {encroachmentsGeoJson && (
                <span className="text-[9px] font-mono text-red-400/70">
                  Encroachments: {encroachmentsGeoJson.features?.length || 0} detected
                </span>
              )}
              <div className="flex-1" />
              <span className="text-[9px] font-mono text-slate-600">{selectedIcao} • Baseline ({baselineFrom} - {baselineTo})</span>
            </motion.div>
          )}
        </div>

        {/* Right Analytics Panel — 25% */}
        <aside className="w-80 glass-dark border-l border-cyan-500/8 flex flex-col h-full overflow-hidden shrink-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Analytics Panel</span>
            {stats && (
              <span className="text-[9px] font-mono text-cyan-400/60">{stats.total} structures</span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {/* Statistics Cards */}
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-2 flex items-center gap-2">
                <div className="w-1 h-3 rounded-full bg-cyan-400" />
                Key Metrics
              </h3>
              <AnalyticsCards stats={stats} />
            </div>

            {/* Charts */}
            <PremiumCharts stats={stats} />

            {/* Timeline */}
            <AnalysisTimeline entries={timeline} />
          </div>
        </aside>
      </div>

      {/* Footer */}
      <PremiumFooter selectedIcao={selectedIcao} />
    </div>
  );
};

export default Dashboard;
