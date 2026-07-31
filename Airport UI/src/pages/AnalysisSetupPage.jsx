import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlane, FaSpinner, FaCheck, FaExclamationTriangle, FaSignOutAlt, FaChevronDown, FaGlobeAsia } from 'react-icons/fa';
import { MdFlightLand, MdSatelliteAlt, MdOutlineRadar, MdDateRange } from 'react-icons/md';
import { useApp } from '../context/AppContext';
import { getAirports, getRunways, runAnalysis, getOLSSurfaces, getEncroachments, computeStats } from '../api/airportApi';

export default function AnalysisSetupPage() {
  const navigate = useNavigate();
  const {
    user,
    logout,
    setSelectedIcao,
    setSelectedRunway,
    setAirportName,
    setBaselineFrom,
    setBaselineTo,
    setMonitoringFrom,
    setMonitoringTo,
    setOlsGeoJson,
    setEncroachmentsGeoJson,
    setStats,
    setAnalysisComplete
  } = useApp();

  const [airports, setAirports] = useState([]);
  const [loadingAirports, setLoadingAirports] = useState(true);
  const [selectedIcao, setLocalSelectedIcao] = useState('');
  const [airportSearch, setAirportSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [runways, setRunways] = useState([]);
  const [loadingRunways, setLoadingRunways] = useState(false);
  const [selectedRunway, setLocalSelectedRunway] = useState('');

  const [localBaselineFrom, setLocalBaselineFrom] = useState('2020-01-01');
  const [localBaselineTo, setLocalBaselineTo] = useState('2020-12-31');
  const [localMonitoringFrom, setLocalMonitoringFrom] = useState('2023-01-01');
  const [localMonitoringTo, setLocalMonitoringTo] = useState('2023-12-31');

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);

  // Helpers for airport display
  const getIcao = (apt) => (typeof apt === 'string' ? apt : (apt.icao || apt.ICAO || ''));
  const getName = (apt) => (typeof apt === 'string' ? apt : (apt.airport_name || apt.Airport_Name || apt.name || getIcao(apt)));
  const getLabel = (apt) => { const ic = getIcao(apt); const nm = getName(apt); return nm.includes(`(${ic})`) ? nm : `${nm} (${ic})`; };

  // Filter airports by search term (name or ICAO)
  const filteredAirports = airportSearch.trim() === ''
    ? airports
    : airports.filter(apt => {
        const q = airportSearch.toLowerCase();
        return getName(apt).toLowerCase().includes(q) || getIcao(apt).toLowerCase().includes(q);
      });

  const handleSelectAirport = (apt) => {
    const icao = getIcao(apt);
    setLocalSelectedIcao(icao);
    setAirportSearch('');
    setShowDropdown(false);
    setErrors(prev => ({ ...prev, airport: undefined }));
  };

  const selectedAirportObj = airports.find(a => getIcao(a) === selectedIcao);
  const displayValue = selectedAirportObj ? getLabel(selectedAirportObj) : '';

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [btnText, setBtnText] = useState('Run OLS Analysis');

  const steps = [
    'Calculating Spatial Anchor',
    'Generating OLS Surfaces',
    'Downloading Satellite Imagery',
    'Running Siamese UNet',
    'Performing Spatial Analytics',
    'Generating Encroachment Report',
    'Preparing Dashboard'
  ];

  useEffect(() => {
    async function fetchAirports() {
      try {
        const data = await getAirports();
        setAirports(data || []);
      } catch (err) {
        setApiError('Failed to load airports.');
      } finally {
        setLoadingAirports(false);
      }
    }
    fetchAirports();
  }, []);

  useEffect(() => {
    async function fetchRunways() {
      if (!selectedIcao) {
        setRunways([]);
        setLocalSelectedRunway('');
        return;
      }
      setLoadingRunways(true);
      try {
        const data = await getRunways(selectedIcao);
        setRunways(data || []);
      } catch (err) {
        setApiError('Failed to load runways.');
      } finally {
        setLoadingRunways(false);
      }
    }
    fetchRunways();
  }, [selectedIcao]);

  const validate = () => {
    const newErrors = {};
    if (!selectedIcao) newErrors.airport = 'Airport is required.';
    if (!selectedRunway) newErrors.runway = 'Runway is required.';
    if (localBaselineFrom > localBaselineTo) newErrors.baseline = 'From date must be <= To date.';
    if (localMonitoringFrom > localMonitoringTo) newErrors.monitoring = 'From date must be <= To date.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAnalyze = async () => {
    if (!validate()) return;
    
    setApiError(null);
    setIsAnalyzing(true);
    setAnalysisStep(0);
    
    // Derive the full airport name for use in the dashboard
    const resolvedAirportName = getName(selectedAirportObj) || selectedIcao;

    // Update context
    setSelectedIcao?.(selectedIcao);
    setSelectedRunway?.(selectedRunway);
    setAirportName?.(resolvedAirportName);
    setBaselineFrom?.(localBaselineFrom);
    setBaselineTo?.(localBaselineTo);
    setMonitoringFrom?.(localMonitoringFrom);
    setMonitoringTo?.(localMonitoringTo);

    try {
      setBtnText('Preparing Analysis...');
      await new Promise(r => setTimeout(r, 1200));
      setAnalysisStep(1);
      
      setBtnText('Processing Backend...');
      await new Promise(r => setTimeout(r, 1200));
      setAnalysisStep(2);
      await new Promise(r => setTimeout(r, 1200));
      setAnalysisStep(3);
      await new Promise(r => setTimeout(r, 1200));
      setAnalysisStep(4);
      
      const analysisPayload = {
        airport_icao: selectedIcao,
        runway_name: selectedRunway,
        baseline: { from_date: localBaselineFrom, to_date: localBaselineTo },
        monitoring: { from_date: localMonitoringFrom, to_date: localMonitoringTo }
      };
      
      // Actual API call
      await runAnalysis(analysisPayload);
      
      setBtnText('Generating Results...');
      setAnalysisStep(5);
      await new Promise(r => setTimeout(r, 1200));
      
      const olsData = await getOLSSurfaces(selectedIcao, selectedRunway);
      const encroachData = await getEncroachments(selectedIcao, selectedRunway);
      
      setAnalysisStep(6);
      await new Promise(r => setTimeout(r, 1200));
      
      setOlsGeoJson?.(olsData);
      setEncroachmentsGeoJson?.(encroachData);
      setStats?.(computeStats(encroachData));
      
      setAnalysisStep(7);
      await new Promise(r => setTimeout(r, 600));
      
      setAnalysisComplete?.(true);

      // Navigate to dashboard passing full structured state
      navigate('/dashboard', {
        state: {
          airport: selectedIcao,
          airportName: resolvedAirportName,
          runway: selectedRunway,
          baseline: { from_date: localBaselineFrom, to_date: localBaselineTo },
          monitoring: { from_date: localMonitoringFrom, to_date: localMonitoringTo },
        }
      });
      
    } catch (err) {
      setIsAnalyzing(false);
      setBtnText('Run OLS Analysis');
      const msg = err.response?.data?.detail || err.message || 'An error occurred during analysis.';
      setApiError(msg);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans overflow-hidden relative">
      {/* Navbar */}
      <nav className="h-16 border-b border-slate-700 bg-slate-900/80 backdrop-blur flex items-center justify-between px-6 z-10 relative">
        <div className="flex items-center gap-3">
          <MdFlightLand className="text-cyan-400 text-2xl" />
          <span className="font-bold text-xl tracking-wide">Airport OLS</span>
        </div>
        <div className="font-semibold text-lg text-slate-300">New Airport Analysis</div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400">{user?.email || 'admin@ols-system.com'}</span>
          <button onClick={() => logout?.()} className="text-slate-400 hover:text-cyan-400 transition flex items-center gap-2">
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main className="p-8 pb-20 max-w-3xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-700 shadow-2xl p-8"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-2xl">
              <FaPlane />
            </div>
            <h1 className="text-3xl font-bold text-slate-100">Configure OLS Analysis</h1>
          </div>

          {apiError && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/50 flex items-start gap-3">
              <FaExclamationTriangle className="text-red-400 mt-1 flex-shrink-0" />
              <div className="text-red-200">{apiError}</div>
            </div>
          )}

          <div className="space-y-8">
            {/* Section 1: Airport Target */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-cyan-400 border-b border-slate-700 pb-2">1. Airport Target</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Custom searchable airport combobox */}
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Airport</label>
                  <div className="relative" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setShowDropdown(false); }} tabIndex={-1}>
                    {/* Search / Display input */}
                    <div className={`flex items-center gap-2 w-full bg-[#08131F] border ${errors.airport ? 'border-red-500' : showDropdown ? 'border-cyan-400' : 'border-slate-600'} rounded-lg py-2.5 px-3 transition-colors cursor-text`}
                      onClick={() => { if (!loadingAirports && !isAnalyzing) setShowDropdown(true); }}>
                      <FaGlobeAsia className="text-cyan-400 shrink-0 text-sm" />
                      <input
                        className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 focus:outline-none min-w-0"
                        placeholder={loadingAirports ? 'Loading airports...' : selectedIcao ? '' : 'Search by name or ICAO...'}
                        value={showDropdown ? airportSearch : displayValue}
                        onChange={(e) => { setAirportSearch(e.target.value); setShowDropdown(true); }}
                        onFocus={() => { if (!loadingAirports && !isAnalyzing) { setShowDropdown(true); setAirportSearch(''); } }}
                        disabled={loadingAirports || isAnalyzing}
                        readOnly={!showDropdown}
                      />
                      {selectedIcao && !showDropdown && (
                        <span className="text-xs font-bold text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-full shrink-0 font-mono">{selectedIcao}</span>
                      )}
                      <FaChevronDown className={`text-slate-400 text-xs shrink-0 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                    </div>

                    {/* Dropdown list */}
                    <AnimatePresence>
                      {showDropdown && (
                        <motion.ul
                          initial={{ opacity: 0, y: -6, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.98 }}
                          transition={{ duration: 0.15 }}
                          className="absolute z-50 left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded-xl border border-cyan-500/20 shadow-2xl"
                          style={{ background: '#08131F', minWidth: '320px' }}
                        >
                          {filteredAirports.length === 0 ? (
                            <li className="px-4 py-3 text-slate-500 text-sm">No airports found</li>
                          ) : filteredAirports.map(apt => {
                            const ic = getIcao(apt);
                            const nm = getName(apt);
                            const isSelected = ic === selectedIcao;
                            return (
                              <li
                                key={ic}
                                onMouseDown={(e) => { e.preventDefault(); handleSelectAirport(apt); }}
                                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                                  isSelected
                                    ? 'bg-cyan-500/15 border-l-2 border-cyan-400'
                                    : 'hover:bg-slate-800/80 border-l-2 border-transparent'
                                }`}
                              >
                                <FaGlobeAsia className={`shrink-0 text-sm ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                                <div className="flex-1 min-w-0">
                                  <div className={`text-sm font-semibold truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>{nm}</div>
                                </div>
                                <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full shrink-0 ${
                                  isSelected ? 'bg-cyan-400/20 text-cyan-300' : 'bg-slate-700/80 text-slate-400'
                                }`}>{ic}</span>
                              </li>
                            );
                          })}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                  {errors.airport && <p className="text-red-400 text-sm mt-1">{errors.airport}</p>}
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">Runway</label>
                  <div className="relative">
                    <select 
                      className={`w-full bg-slate-900 border ${errors.runway ? 'border-red-500' : 'border-slate-600'} rounded-lg py-3 px-4 text-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                      value={selectedRunway}
                      onChange={(e) => setLocalSelectedRunway(e.target.value)}
                      disabled={!selectedIcao || loadingRunways || isAnalyzing}
                    >
                      <option value="">{loadingRunways ? 'Loading...' : 'Select Runway...'}</option>
                      {runways.map(rw => (
                        <option key={rw} value={rw}>{rw}</option>
                      ))}
                    </select>
                    <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                  {errors.runway && <p className="text-red-400 text-sm mt-1">{errors.runway}</p>}
                </div>
              </div>
            </section>

            {/* Section 2: Satellite Imagery Time Selection */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-cyan-400 border-b border-slate-700 pb-2">2. Satellite Imagery Time Selection</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Baseline */}
                <div className="bg-slate-900/50 rounded-xl p-5 border border-cyan-500/30">
                  <div className="flex items-center gap-2 mb-4 text-cyan-300 font-medium">
                    <MdSatelliteAlt />
                    <h3>Baseline Imagery</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">From Date</label>
                      <input 
                        type="date" 
                        value={localBaselineFrom}
                        onChange={(e) => setLocalBaselineFrom(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-cyan-500"
                        disabled={isAnalyzing}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">To Date</label>
                      <input 
                        type="date" 
                        value={localBaselineTo}
                        onChange={(e) => setLocalBaselineTo(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-cyan-500"
                        disabled={isAnalyzing}
                      />
                    </div>
                  </div>
                  {errors.baseline && <p className="text-red-400 text-sm mt-2">{errors.baseline}</p>}
                </div>

                {/* Monitoring */}
                <div className="bg-slate-900/50 rounded-xl p-5 border border-blue-500/30">
                  <div className="flex items-center gap-2 mb-4 text-blue-300 font-medium">
                    <MdDateRange />
                    <h3>Monitoring Imagery</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">From Date</label>
                      <input 
                        type="date" 
                        value={localMonitoringFrom}
                        onChange={(e) => setLocalMonitoringFrom(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500"
                        disabled={isAnalyzing}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">To Date</label>
                      <input 
                        type="date" 
                        value={localMonitoringTo}
                        onChange={(e) => setLocalMonitoringTo(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500"
                        disabled={isAnalyzing}
                      />
                    </div>
                  </div>
                  {errors.monitoring && <p className="text-red-400 text-sm mt-2">{errors.monitoring}</p>}
                </div>
              </div>
            </section>

            {/* Submit */}
            <div className="pt-6">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                {isAnalyzing ? <FaSpinner className="animate-spin" /> : <FaPlane />}
                <span>{btnText}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Full-Screen Processing Overlay */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-xl flex flex-col items-center justify-center p-6"
          >
            <div className="max-w-md w-full bg-slate-800/80 border border-slate-700 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-slate-700">
                <motion.div 
                  className="h-full bg-cyan-500"
                  initial={{ width: '0%' }}
                  animate={{ width: String(Math.round((analysisStep / steps.length) * 100)) + '%' }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              <div className="flex flex-col items-center mb-8">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-t-2 border-r-2 border-cyan-500"
                  />
                  <MdOutlineRadar className="text-4xl text-cyan-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mt-4">Running Analysis</h2>
                <p className="text-cyan-400 text-sm mt-1">{selectedIcao} - {selectedRunway}</p>
              </div>

              <div className="space-y-4">
                {steps.map((step, idx) => {
                  const isActive = idx === analysisStep;
                  const isCompleted = idx < analysisStep;
                  
                  return (
                    <div key={step} className="flex items-center gap-3">
                      <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                        {isCompleted ? (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-green-400">
                            <FaCheck />
                          </motion.div>
                        ) : isActive ? (
                          <FaSpinner className="text-cyan-400 animate-spin" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-slate-600" />
                        )}
                      </div>
                      <span className={`text-sm \${isActive ? 'text-white font-medium' : isCompleted ? 'text-slate-400' : 'text-slate-600'}`}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
