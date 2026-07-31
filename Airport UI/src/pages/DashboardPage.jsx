import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaSignOutAlt, FaLayerGroup, FaDownload, FaBell, FaUserCircle,
  FaChevronLeft, FaChevronRight, FaMap, FaCog, FaQuestionCircle,
  FaFilePdf, FaFileExport, FaDatabase, FaEye, FaPlane
} from 'react-icons/fa';
import { MdFlightLand, MdOutlineRadar, MdSatelliteAlt, MdAnalytics, MdFileDownload } from 'react-icons/md';
import { IoLayersOutline } from 'react-icons/io5';
import { useApp } from '../context/AppContext';
import { PremiumGoogleMap } from '../components/PremiumGoogleMap';
import { AnalyticsCards } from '../components/AnalyticsCards';
import { PremiumCharts } from '../components/PremiumCharts';
import { downloadCSV, downloadTXT, openGeoJSON, downloadGeoJSON } from '../api/airportApi';
import { captureAndUploadMapSnapshot } from '../utils/mapSnapshot';

const DashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ─── Context (persistent across refreshes / page transitions) ────────────
  const {
    user,
    logout,
    selectedIcao: ctxIcao,
    airportName: ctxAirportName,
    selectedRunway: ctxRunway,
    baselineFrom: ctxBaselineFrom,
    baselineTo: ctxBaselineTo,
    monitoringFrom: ctxMonitoringFrom,
    monitoringTo: ctxMonitoringTo,
    layers,
    toggleLayer,
    olsOpacity,
    setOlsOpacity,
    olsGeoJson,
    encroachmentsGeoJson,
    analysisComplete,
    stats,
  } = useApp();

  // ─── Router state (passed from AnalysisSetupPage via navigate()) ──────────
  const routeState = location.state || {};

  // Prefer router state (freshest), fall back to context values
  const airport      = routeState.airport      ?? ctxIcao             ?? '';
  const airportName  = routeState.airportName  ?? ctxAirportName      ?? airport;
  const runway       = routeState.runway       ?? ctxRunway            ?? '';
  const baseline     = routeState.baseline     ?? {
    from_date: ctxBaselineFrom  ?? '',
    to_date:   ctxBaselineTo    ?? '',
  };
  const monitoring   = routeState.monitoring   ?? {
    from_date: ctxMonitoringFrom ?? '',
    to_date:   ctxMonitoringTo   ?? '',
  };

  // Safe accessors with fallbacks — dashboard never crashes on missing data
  const baselineFrom  = baseline?.from_date  ?? '';
  const baselineTo    = baseline?.to_date    ?? '';
  const monitoringFrom = monitoring?.from_date ?? '';
  const monitoringTo  = monitoring?.to_date   ?? '';

  // ─── UI state ─────────────────────────────────────────────────────────────
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showToast, setShowToast] = useState(false);
  // Per-button loading: 'csv' | 'report' | 'viewGeoJSON' | 'dlGeoJSON' | null
  const [exportLoading, setExportLoading] = useState(null);
  // Export feedback toast: { type: 'success'|'error', msg: string } | null
  const [exportFeedback, setExportFeedback] = useState(null);
  // Snapshot feedback toast: { type: 'success'|'error', msg: string } | null
  const [snapshotFeedback, setSnapshotFeedback] = useState(null);
  // Guard: capture only once per analysis session
  const snapshotTakenRef = useRef(false);

  // ─── Auth guard ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  // ─── Success toast on arrival ─────────────────────────────────────────────
  useEffect(() => {
    if (analysisComplete) {
      setShowToast(true);
      const t = setTimeout(() => setShowToast(false), 6000);
      return () => clearTimeout(t);
    }
  }, [analysisComplete]);

  // ─── Automatic map snapshot (once per analysis) ───────────────────────────
  useEffect(() => {
    // Only fire when a fresh analysis has just completed and GeoJSON is ready
    if (!analysisComplete || !airport || !olsGeoJson || snapshotTakenRef.current) return;

    // Mark as taken immediately so re-renders don't re-trigger
    snapshotTakenRef.current = true;

    // Run snapshot asynchronously after map tiles and fitBounds animation fully settle (5s)
    const timer = setTimeout(async () => {
      try {
        const result = await captureAndUploadMapSnapshot({
          icao:                 airport,
          olsGeoJson:           olsGeoJson,
          encroachmentsGeoJson: encroachmentsGeoJson,
          delayMs:              1000,
        });

        setSnapshotFeedback(result);
        setTimeout(() => setSnapshotFeedback(null), 6000);
      } catch (err) {
        console.warn('[MapSnapshot] Non-fatal snapshot error:', err);
        setSnapshotFeedback({ success: false, message: 'Unable to save dashboard snapshot.' });
        setTimeout(() => setSnapshotFeedback(null), 6000);
      }
    }, 4000);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysisComplete, airport, olsGeoJson]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleLogout = () => { logout(); navigate('/login'); };
  const handleRunNewAnalysis = () => navigate('/setup');

  /** Reusable export wrapper — per-button loading + bottom toast */
  const handleExport = async (key, label, fn) => {
    if (!airport) {
      setExportFeedback({ type: 'error', msg: 'No airport selected. Please run an analysis first.' });
      setTimeout(() => setExportFeedback(null), 4000);
      return;
    }
    setExportLoading(key);
    setExportFeedback(null);
    try {
      await fn(airport);
      setExportFeedback({ type: 'success', msg: `${label} downloaded successfully.` });
    } catch (err) {
      setExportFeedback({ type: 'error', msg: err.message || `Failed to download ${label}.` });
    } finally {
      setExportLoading(null);
      setTimeout(() => setExportFeedback(null), 5000);
    }
  };

  // ─── Empty state guard ────────────────────────────────────────────────────
  if (!analysisComplete && !olsGeoJson) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#08131F] text-white gap-4">
        <div className="w-20 h-20 rounded-full bg-cyan-500/10 flex items-center justify-center">
          <MdOutlineRadar className="text-5xl text-cyan-400 animate-pulse" />
        </div>
        <h2 className="text-2xl font-bold">No Analysis Data Available</h2>
        <p className="text-slate-400 text-sm">Please configure and run a new OLS analysis.</p>
        <button
          onClick={handleRunNewAnalysis}
          className="mt-2 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-xl shadow-lg transition-all"
        >
          <FaPlane /> Start New Analysis
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#08131F] text-gray-200 overflow-hidden font-sans">

      {/* ── 1. Top Navbar ─────────────────────────────────────────────────── */}
      <header className="flex-none h-[52px] bg-[#0a1929]/90 backdrop-blur-md border-b border-cyan-500/10 flex items-center justify-between px-4 z-20">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <MdOutlineRadar className="text-2xl text-cyan-400 animate-pulse" />
          <span className="text-base font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            AirportOLS
          </span>
        </div>

        {/* Centre meta pills */}
        <div className="hidden md:flex items-center gap-2 flex-wrap justify-center">
          {airportName && airportName !== airport && (
            <span className="px-2.5 py-1 text-xs font-medium bg-cyan-900/30 border border-cyan-700/40 rounded-full text-cyan-200 max-w-[240px] truncate">
              {airportName}
            </span>
          )}
          {airport && (
            <span className="px-2.5 py-1 text-xs font-bold font-mono bg-cyan-900/40 border border-cyan-600/50 rounded-full text-cyan-300">
              {airport}
            </span>
          )}
          {runway && (
            <span className="px-2.5 py-1 text-xs font-medium bg-blue-900/40 border border-blue-700/50 rounded-full text-blue-200">
              RWY {runway}
            </span>
          )}
          {baselineFrom && (
            <span className="px-2.5 py-1 text-xs bg-slate-800/60 border border-slate-700 rounded-full text-slate-300">
              Base {baselineFrom} → {baselineTo}
            </span>
          )}
          {monitoringFrom && (
            <span className="px-2.5 py-1 text-xs bg-slate-800/60 border border-slate-700 rounded-full text-slate-300">
              Monitor {monitoringFrom} → {monitoringTo}
            </span>
          )}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3 shrink-0">
          <button className="text-gray-400 hover:text-cyan-400 transition-colors">
            <FaBell size={16} />
          </button>
          <div className="flex items-center gap-1.5 text-sm text-gray-300">
            <FaUserCircle size={18} className="text-cyan-500" />
            <span className="hidden sm:inline text-xs">{user?.email ?? ''}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            <FaSignOutAlt /> <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* ── 2. Main layout ────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left Sidebar */}
        <motion.aside
          initial={false}
          animate={{ width: sidebarCollapsed ? 48 : 240 }}
          transition={{ type: 'tween', duration: 0.22 }}
          className="flex-none bg-[#0a1929]/80 backdrop-blur-sm border-r border-cyan-500/10 flex flex-col z-10"
        >
          {/* Toggle button */}
          <div className="flex items-center justify-end p-2 border-b border-cyan-500/10">
            <button
              onClick={() => setSidebarCollapsed(c => !c)}
              className="p-1.5 rounded bg-[#0d2137] text-gray-400 hover:text-cyan-400 hover:bg-[#112840] transition-colors"
            >
              {sidebarCollapsed ? <FaChevronRight size={12} /> : <FaChevronLeft size={12} />}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="p-4 space-y-5"
                >
                  {/* ── Analysis Summary ── */}
                  <div className="space-y-1">
                    <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <MdAnalytics /> Summary
                    </h3>
                    <div className="bg-[#0d2137]/60 rounded-lg p-3 text-xs text-gray-300 space-y-2">
                      {airportName && (
                        <div>
                          <span className="text-gray-500 block mb-0.5">Airport</span>
                          <span className="font-medium text-cyan-200 leading-tight block">{airportName}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-500">ICAO</span>
                        <span className="font-bold text-cyan-300 font-mono">{airport || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Runway</span>
                        <span className="font-medium text-cyan-300">{runway || '—'}</span>
                      </div>
                      {baselineFrom && (
                        <div>
                          <span className="text-gray-500 block mb-0.5">Baseline</span>
                          <span className="text-slate-300">{baselineFrom} → {baselineTo}</span>
                        </div>
                      )}
                      {monitoringFrom && (
                        <div>
                          <span className="text-gray-500 block mb-0.5">Monitoring</span>
                          <span className="text-slate-300">{monitoringFrom} → {monitoringTo}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Map Layers ── */}
                  <div>
                    <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <IoLayersOutline /> Map Layers
                    </h3>
                    <div className="space-y-2.5">
                      {[
                        { key: 'olsSurfaces', label: 'OLS Surfaces' },
                        { key: 'encroachments', label: 'Encroachments' },
                        { key: 'labels', label: 'Labels' },
                        { key: 'satelliteView', label: 'Satellite View' },
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center justify-between cursor-pointer group">
                          <span className="text-xs text-gray-300 group-hover:text-cyan-300 transition-colors">{label}</span>
                          <div className="relative" onClick={() => toggleLayer(key)}>
                            <div className={`w-8 h-4 rounded-full transition-colors ${layers?.[key] ? 'bg-cyan-500' : 'bg-gray-700'}`} />
                            <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all duration-200 ${layers?.[key] ? 'left-[18px]' : 'left-0.5'}`} />
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* ── OLS Opacity ── */}
                  <div>
                    <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <FaEye /> OLS Opacity
                    </h3>
                    <input
                      type="range" min="0.02" max="0.30" step="0.02"
                      value={olsOpacity}
                      onChange={e => setOlsOpacity(parseFloat(e.target.value))}
                      className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                    <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                      <span>Low</span><span>High</span>
                    </div>
                  </div>

                  {/* ── Legend ── */}
                  <div>
                    <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <FaMap /> Legend
                    </h3>
                    <div className="space-y-1.5 text-xs">
                      {[
                        { color: 'bg-red-500/80 border-red-500', label: 'Critical' },
                        { color: 'bg-orange-500/80 border-orange-500', label: 'High Risk' },
                        { color: 'bg-yellow-500/80 border-yellow-500', label: 'Medium Risk' },
                        { color: 'bg-green-500/80 border-green-500', label: 'Low Risk' },
                        { color: 'bg-cyan-500/30 border-cyan-500', label: 'OLS Surface' },
                      ].map(({ color, label }) => (
                        <div key={label} className="flex items-center gap-2">
                          <div className={`w-3 h-3 ${color} border rounded-sm`} />
                          <span className="text-gray-400">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Quick Export ── */}
                  <div>
                    <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <FaFileExport /> Quick Export
                    </h3>
                    <div className="flex flex-col gap-1.5">
                      {[
                        { key: 'viewGeoJSON', label: 'View GeoJSON',     icon: <FaDatabase className="text-blue-400" />,   fn: openGeoJSON,    busy: 'Opening...' },
                        { key: 'dlGeoJSON',   label: 'Download GeoJSON', icon: <FaDownload className="text-blue-300" />,   fn: downloadGeoJSON, busy: 'Preparing...' },
                        { key: 'csv',         label: 'Download CSV',     icon: <FaFileExport className="text-green-400" />, fn: downloadCSV,    busy: 'Preparing...' },
                        { key: 'report',      label: 'Download Report',  icon: <FaFilePdf className="text-red-400" />,     fn: downloadTXT,    busy: 'Preparing...' },
                      ].map(({ key, label, icon, fn, busy }) => (
                        <button
                          key={key}
                          className="flex items-center gap-2 text-xs py-1.5 px-2.5 bg-[#0d2137] hover:bg-[#112840] rounded transition-colors text-left disabled:opacity-50"
                          onClick={() => handleExport(key, label, fn)}
                          disabled={exportLoading !== null}
                        >
                          {icon}
                          <span>{exportLoading === key ? busy : label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ── Help ── */}
                  <div className="pt-2 border-t border-cyan-500/10 text-[11px] text-gray-600">
                    <p className="flex items-center gap-1 mb-1"><FaQuestionCircle /> Need Help?</p>
                    <p>Toggle layers and adjust opacity for better OLS visualization.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Collapsed icon strip */}
            <AnimatePresence>
              {sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center py-4 gap-5 text-gray-500"
                >
                  {[MdAnalytics, IoLayersOutline, FaEye, FaMap, FaFileExport].map((Icon, i) => (
                    <Icon key={i} size={18} className="hover:text-cyan-400 cursor-pointer transition-colors" onClick={() => setSidebarCollapsed(false)} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.aside>

        {/* ── Center Map ─────────────────────────────────────────────────── */}
        <main className="flex-1 relative flex flex-col bg-black overflow-hidden">
          <div className="flex-1 relative">
            <PremiumGoogleMap
              selectedIcao={airport}
              selectedRunway={runway}
              olsGeoJson={olsGeoJson}
              encroachmentsGeoJson={encroachmentsGeoJson}
              layers={layers}
              olsOpacity={olsOpacity}
              onToggleSatellite={() => toggleLayer('satelliteView')}
            />
          </div>
          {/* Map status bar */}
          <div className="absolute bottom-0 left-0 right-0 h-7 bg-[#0a1929]/90 border-t border-cyan-500/15 flex items-center px-4 text-[11px] justify-between z-10 pointer-events-none">
            <div className="flex items-center gap-4 text-gray-400">
              <span className="flex items-center gap-1"><IoLayersOutline className="text-cyan-400" /> OLS Surfaces Loaded</span>
              {stats?.total > 0 && (
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  {stats.total} Encroachments
                </span>
              )}
            </div>
            <span className="text-gray-600">{airport}{runway ? ` · RWY ${runway}` : ''}</span>
          </div>
        </main>

        {/* ── Right Analytics Panel ─────────────────────────────────────── */}
        <aside className="w-72 bg-[#0a1929] border-l border-cyan-500/10 flex flex-col z-10 hidden lg:flex">
          <div className="p-3 border-b border-cyan-500/10 flex items-center justify-between bg-[#0d2137]/50">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <MdAnalytics className="text-cyan-400" size={16} /> Analytics Panel
            </h2>
            <span className="text-xs bg-[#0d2137] px-2 py-0.5 rounded text-cyan-200">
              {stats?.total ?? 0} Structures
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {!stats ? (
              <div className="space-y-3 animate-pulse">
                {[80, 64, 80].map((h, i) => (
                  <div key={i} style={{ height: h }} className="bg-[#0d2137] rounded-lg skeleton" />
                ))}
              </div>
            ) : (
              <>
                <AnalyticsCards stats={stats} />
                <div className="pt-2">
                  <PremiumCharts stats={stats} />
                </div>
              </>
            )}
          </div>
        </aside>
      </div>

      {/* ── 3. Bottom Export Bar ──────────────────────────────────────────── */}
      <div className="h-[52px] flex-none bg-[#0a1929]/90 border-t border-cyan-500/15 flex items-center justify-between px-4 z-20 gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { key: 'viewGeoJSON', label: 'View GeoJSON',     icon: <FaDatabase className="text-blue-400" />,    fn: openGeoJSON,     busy: 'Opening...' },
            { key: 'dlGeoJSON',   label: 'Download GeoJSON', icon: <FaDownload className="text-blue-300" />,    fn: downloadGeoJSON, busy: 'Preparing...' },
            { key: 'csv',         label: 'CSV Data',          icon: <FaFileExport className="text-green-400" />, fn: downloadCSV,     busy: 'Preparing...' },
            { key: 'report',      label: 'Report',            icon: <FaFilePdf className="text-red-400" />,      fn: downloadTXT,     busy: 'Preparing...' },
          ].map(({ key, label, icon, fn, busy }) => (
            <button
              key={key}
              onClick={() => handleExport(key, label, fn)}
              disabled={exportLoading !== null}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#0d2137] hover:bg-[#112840] text-gray-200 rounded-md transition-colors border border-[#163450] hover:border-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {icon}
              <span>{exportLoading === key ? busy : label}</span>
            </button>
          ))}
        </div>
        <button
          onClick={handleRunNewAnalysis}
          className="flex items-center gap-2 text-xs px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-md transition-all shadow shadow-cyan-900/20 shrink-0"
        >
          <MdFlightLand size={14} /> New Analysis
        </button>
      </div>

      {/* ── 4. Analysis Complete Toast ────────────────────────────────────── */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -40, x: 40 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-14 right-4 z-50 bg-[#0a1929] border border-green-500/40 border-l-4 border-l-green-500 rounded-xl shadow-2xl p-4 min-w-[300px] max-w-[360px]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <h4 className="font-semibold text-green-400 text-sm">✓ Analysis Completed Successfully</h4>
                <div className="text-xs text-gray-300 space-y-0.5">
                  {airportName && <p className="font-medium text-slate-200">{airportName}</p>}
                  {airport   && <p>ICAO: <span className="font-mono text-cyan-300">{airport}</span></p>}
                  {runway    && <p>Runway: <span className="text-cyan-300">{runway}</span></p>}
                  {baselineFrom  && <p>Baseline: {baselineFrom} → {baselineTo}</p>}
                  {monitoringFrom && <p>Monitoring: {monitoringFrom} → {monitoringTo}</p>}
                </div>
              </div>
              <button onClick={() => setShowToast(false)} className="text-gray-500 hover:text-white text-lg leading-none shrink-0">&times;</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 5. Export Feedback Toast ──────────────────────────────────────── */}
      <AnimatePresence>
        {exportFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.2 }}
            className={`fixed bottom-16 right-4 z-50 rounded-xl shadow-2xl p-4 min-w-[260px] max-w-[380px] border-l-4 bg-[#0a1929] ${
              exportFeedback.type === 'success' ? 'border-l-green-500' : 'border-l-red-500'
            }`}
          >
            <div className="flex items-start gap-3 justify-between">
              <div>
                <h4 className={`font-semibold text-sm mb-0.5 ${exportFeedback.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                  {exportFeedback.type === 'success' ? '✓ Export Successful' : '✗ Export Failed'}
                </h4>
                <p className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">{exportFeedback.msg}</p>
              </div>
              <button onClick={() => setExportFeedback(null)} className="text-gray-500 hover:text-white text-lg leading-none shrink-0">&times;</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ── 6. Map Snapshot Toast ─────────────────────────────────────────── */}
      <AnimatePresence>
        {snapshotFeedback && (
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            className={`fixed bottom-[5.5rem] right-4 z-50 rounded-xl shadow-2xl p-3.5
              min-w-[260px] max-w-[380px] border-l-4 bg-[#0a1929]
              ${snapshotFeedback.success ? 'border-l-cyan-500' : 'border-l-amber-500'}`}
          >
            <div className="flex items-start gap-3 justify-between">
              <div>
                <h4 className={`font-semibold text-sm mb-0.5 flex items-center gap-1.5
                  ${snapshotFeedback.success ? 'text-cyan-400' : 'text-amber-400'}`}>
                  {snapshotFeedback.success
                    ? '📷 Dashboard snapshot saved successfully.'
                    : '⚠ Unable to save dashboard snapshot.'}
                </h4>
                {!snapshotFeedback.success && (
                  <p className="text-[11px] text-gray-400 leading-relaxed mt-0.5">
                    PDF generation will continue without the map image.
                  </p>
                )}
              </div>
              <button
                onClick={() => setSnapshotFeedback(null)}
                className="text-gray-500 hover:text-white text-lg leading-none shrink-0"
              >&times;</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default DashboardPage;
