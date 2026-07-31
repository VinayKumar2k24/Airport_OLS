import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaChevronLeft, FaChevronRight, FaPlane, FaPlay,
  FaDownload, FaLayerGroup, FaFileAlt, FaFileCsv,
  FaFileCode, FaSpinner, FaGlobe, FaBuilding,
  FaTag, FaMap, FaMountain, FaLocationArrow, FaSatellite
} from 'react-icons/fa';
import { MdFlightLand, MdOutlineRadar } from 'react-icons/md';
import { IoLayersOutline } from 'react-icons/io5';

const SidebarSection = ({ title, icon: Icon, children }) => (
  <div className="mb-4">
    <div className="flex items-center gap-2 mb-2.5 px-1">
      <Icon className="text-cyan-400 text-[11px]" />
      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">{title}</span>
    </div>
    {children}
  </div>
);

const ToggleSwitch = ({ checked, onChange, color = 'cyan' }) => {
  const colors = {
    cyan: { track: checked ? 'bg-cyan-500' : 'bg-slate-700', thumb: 'bg-white', glow: checked ? 'shadow-neon-cyan' : '' },
    blue: { track: checked ? 'bg-blue-500' : 'bg-slate-700', thumb: 'bg-white', glow: '' },
    emerald: { track: checked ? 'bg-emerald-500' : 'bg-slate-700', thumb: 'bg-white', glow: '' },
  };
  const c = colors[color] || colors.cyan;

  return (
    <button
      onClick={onChange}
      className={`relative inline-flex w-9 h-5 rounded-full transition-all duration-300 ${c.track} ${c.glow}`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${checked ? 'left-5' : 'left-0.5'}`}
      />
    </button>
  );
};

const LayerItem = ({ icon: Icon, label, checked, onChange, color = 'text-cyan-400' }) => (
  <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/3 transition-colors group cursor-pointer" onClick={onChange}>
    <div className="flex items-center gap-2.5">
      <Icon className={`text-sm ${color} group-hover:scale-110 transition-transform`} />
      <span className="text-[12px] font-medium text-slate-300 group-hover:text-white transition-colors">{label}</span>
    </div>
    <ToggleSwitch checked={checked} onChange={onChange} />
  </div>
);

export const PremiumSidebar = ({
  airports = [], selectedIcao, onSelectAirport, loadingAirports = false,
  runways = [], selectedRunway, onSelectRunway, loadingRunways = false,
  baselineFrom, setBaselineFrom,
  baselineTo, setBaselineTo,
  monitoringFrom, setMonitoringFrom,
  monitoringTo, setMonitoringTo,
  onAnalyze, isAnalyzing, validationError,
  layers, onToggleLayer, olsOpacity = 0.08, onChangeOpacity,
  onDownloadTXT, onDownloadCSV, onOpenGeoJSON,
  hasData,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState({});

  const handleDownload = async (key, fn) => {
    setDownloadLoading(prev => ({ ...prev, [key]: true }));
    try { await fn(); } catch (e) { console.error(e); }
    finally { setDownloadLoading(prev => ({ ...prev, [key]: false })); }
  };

  if (collapsed) {
    return (
      <motion.div
        initial={{ width: 240 }} animate={{ width: 48 }}
        className="glass-dark border-r border-cyan-500/8 flex flex-col items-center py-4 gap-4 h-full shrink-0"
      >
        <button onClick={() => setCollapsed(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition-colors">
          <FaChevronRight className="text-xs" />
        </button>
        <div className="flex flex-col gap-3 mt-2">
          <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-navy-800 text-cyan-400/60"><MdOutlineRadar className="text-base" /></div>
          <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-navy-800 text-cyan-400/60"><IoLayersOutline className="text-base" /></div>
          <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-navy-800 text-cyan-400/60"><FaDownload className="text-sm" /></div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.aside
      initial={{ width: 0, opacity: 0 }} animate={{ width: 280, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="glass-dark border-r border-cyan-500/8 h-full overflow-y-auto shrink-0 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <MdOutlineRadar className="text-cyan-400 text-base" />
          <span className="text-xs font-bold tracking-wider text-slate-200 uppercase">Analysis Control</span>
        </div>
        <button onClick={() => setCollapsed(true)} className="w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:text-slate-300 transition-colors">
          <FaChevronLeft className="text-[10px]" />
        </button>
      </div>

      <div className="flex-1 p-3 overflow-y-auto space-y-1">
        {/* Airport Selector */}
        <SidebarSection title="Airport Target" icon={FaGlobe}>
          <div className="glass-card rounded-xl p-3 space-y-3">
            <div>
              <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-1.5">AIRPORT / ICAO</label>
              <select
                value={selectedIcao}
                onChange={e => onSelectAirport(e.target.value)}
                disabled={isAnalyzing || loadingAirports || airports.length === 0}
                className="w-full bg-navy-950/80 border border-slate-700/50 hover:border-cyan-500/40 focus:border-cyan-400 focus:outline-none text-white text-xs font-semibold rounded-lg px-3 py-2.5 transition-all disabled:opacity-50 appearance-none cursor-pointer truncate"
              >
                {loadingAirports ? (
                  <option value="">Loading Airports...</option>
                ) : (
                  airports.map(a => {
                    const icao = typeof a === 'string' ? a : (a.icao || a.ICAO);
                    const name = typeof a === 'string' ? a : (a.airport_name || a.Airport_Name || icao);
                    const label = name.includes(`(${icao})`) ? name : `${name} (${icao})`;
                    return (
                      <option key={icao} value={icao} className="bg-navy-900">
                        {label}
                      </option>
                    );
                  })
                )}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-1.5">RUNWAY DESIGNATION</label>
              <select
                value={selectedRunway}
                onChange={e => onSelectRunway(e.target.value)}
                disabled={isAnalyzing || loadingRunways || runways.length === 0}
                className="w-full bg-navy-950/80 border border-slate-700/50 hover:border-cyan-500/40 focus:border-cyan-400 focus:outline-none text-white text-sm font-semibold rounded-lg px-3 py-2.5 transition-all disabled:opacity-50 appearance-none cursor-pointer"
              >
                {loadingRunways ? (
                  <option value="">Loading Runways...</option>
                ) : runways.length === 0 ? (
                  <option value="">No runways found</option>
                ) : (
                  runways.map(r => (
                    <option key={r} value={r} className="bg-navy-900">{r}</option>
                  ))
                )}
              </select>
            </div>
          </div>
        </SidebarSection>

        {/* Satellite Imagery Time Selection */}
        <SidebarSection title="Satellite Imagery Time Selection" icon={FaSatellite}>
          <div className="space-y-2.5">
            {/* Card 1: Baseline Imagery */}
            <div className="glass-card rounded-xl p-3 border border-cyan-500/15">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400" />
                <span className="text-[11px] font-bold text-cyan-300">Baseline Imagery</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-mono text-slate-400 block mb-1">FROM DATE</label>
                  <input
                    type="date"
                    value={baselineFrom}
                    onChange={e => setBaselineFrom(e.target.value)}
                    disabled={isAnalyzing}
                    className="w-full bg-navy-950/90 border border-slate-700/60 hover:border-cyan-500/40 focus:border-cyan-400 focus:outline-none text-white text-[10px] font-mono rounded-lg px-2 py-1.5 transition-all cursor-pointer disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono text-slate-400 block mb-1">TO DATE</label>
                  <input
                    type="date"
                    value={baselineTo}
                    onChange={e => setBaselineTo(e.target.value)}
                    disabled={isAnalyzing}
                    className="w-full bg-navy-950/90 border border-slate-700/60 hover:border-cyan-500/40 focus:border-cyan-400 focus:outline-none text-white text-[10px] font-mono rounded-lg px-2 py-1.5 transition-all cursor-pointer disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Monitoring Imagery */}
            <div className="glass-card rounded-xl p-3 border border-blue-500/15">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-[11px] font-bold text-blue-300">Monitoring Imagery</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-mono text-slate-400 block mb-1">FROM DATE</label>
                  <input
                    type="date"
                    value={monitoringFrom}
                    onChange={e => setMonitoringFrom(e.target.value)}
                    disabled={isAnalyzing}
                    className="w-full bg-navy-950/90 border border-slate-700/60 hover:border-cyan-500/40 focus:border-cyan-400 focus:outline-none text-white text-[10px] font-mono rounded-lg px-2 py-1.5 transition-all cursor-pointer disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono text-slate-400 block mb-1">TO DATE</label>
                  <input
                    type="date"
                    value={monitoringTo}
                    onChange={e => setMonitoringTo(e.target.value)}
                    disabled={isAnalyzing}
                    className="w-full bg-navy-950/90 border border-slate-700/60 hover:border-cyan-500/40 focus:border-cyan-400 focus:outline-none text-white text-[10px] font-mono rounded-lg px-2 py-1.5 transition-all cursor-pointer disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
          </div>
        </SidebarSection>

        {/* Validation Warning Notice if any */}
        {validationError && (
          <div className="px-3 py-2 rounded-lg bg-red-950/80 border border-red-500/40 text-red-300 text-[10px] font-semibold flex items-center gap-1.5">
            <span>⚠</span>
            <span>{validationError}</span>
          </div>
        )}

        {/* Analyze Button */}
        <SidebarSection title="OLS Analysis" icon={MdFlightLand}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onAnalyze}
            disabled={isAnalyzing || !selectedIcao || !selectedRunway || !!validationError}
            className="w-full relative overflow-hidden rounded-xl py-3.5 px-4 font-bold text-sm tracking-widest uppercase disabled:opacity-50 disabled:cursor-not-allowed group"
            style={{
              background: isAnalyzing
                ? 'rgba(30, 50, 80, 0.8)'
                : 'linear-gradient(135deg, #0066cc 0%, #00ccff 50%, #0066cc 100%)',
              backgroundSize: '200% 100%',
              boxShadow: isAnalyzing ? 'none' : '0 4px 20px rgba(0, 150, 255, 0.4)',
            }}
          >
            <div className="flex items-center justify-center gap-2 relative z-10">
              {isAnalyzing ? (
                <><FaSpinner className="animate-spin text-cyan-300" /><span className="text-slate-300">Analyzing...</span></>
              ) : (
                <><FaPlay className="text-xs" /><span>Run OLS Analysis</span></>
              )}
            </div>
            {!isAnalyzing && (
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
            )}
          </motion.button>
        </SidebarSection>

        {/* Layer Controls */}
        <SidebarSection title="Map Layers" icon={IoLayersOutline}>
          <div className="glass-card rounded-xl overflow-hidden">
            <LayerItem icon={FaLayerGroup} label="OLS Surfaces" checked={layers.olsSurfaces} onChange={() => onToggleLayer('olsSurfaces')} color="text-cyan-400" />
            {layers.olsSurfaces && (
              <div className="px-3 py-1.5 bg-navy-950/60 rounded-lg mx-2 mb-1 border border-cyan-500/10">
                <div className="flex justify-between text-[9px] font-mono text-slate-400 mb-1">
                  <span>Opacity</span>
                  <span className="text-cyan-400 font-bold">{(olsOpacity * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.20"
                  step="0.01"
                  value={olsOpacity}
                  onChange={(e) => onChangeOpacity && onChangeOpacity(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}
            <div className="h-px bg-slate-800/60 mx-3" />
            <LayerItem icon={FaBuilding} label="Encroachments" checked={layers.encroachments} onChange={() => onToggleLayer('encroachments')} color="text-red-400" />
            <div className="h-px bg-slate-800/60 mx-3" />
            <LayerItem icon={FaTag} label="Labels" checked={layers.labels} onChange={() => onToggleLayer('labels')} color="text-amber-400" />
            <div className="h-px bg-slate-800/60 mx-3" />
            <LayerItem icon={FaSatellite} label="Satellite View" checked={layers.satelliteView} onChange={() => onToggleLayer('satelliteView')} color="text-blue-400" />
            <div className="h-px bg-slate-800/60 mx-3" />
            <LayerItem icon={FaMountain} label="Terrain View" checked={layers.terrainView} onChange={() => onToggleLayer('terrainView')} color="text-emerald-400" />
            <div className="h-px bg-slate-800/60 mx-3" />
            <LayerItem icon={FaMap} label="Heatmap" checked={layers.heatmap} onChange={() => onToggleLayer('heatmap')} color="text-purple-400" />
          </div>
        </SidebarSection>

        {/* Downloads */}
        <SidebarSection title="Export Artifacts" icon={FaDownload}>
          <div className="space-y-2">
            {[
              { key: 'txt', label: 'Compliance Report', ext: 'TXT', icon: FaFileAlt, color: 'border-amber-500/30 hover:border-amber-400/60', iconColor: 'text-amber-400', fn: onDownloadTXT },
              { key: 'csv', label: 'Encroachment Summary', ext: 'CSV', icon: FaFileCsv, color: 'border-emerald-500/30 hover:border-emerald-400/60', iconColor: 'text-emerald-400', fn: onDownloadCSV },
              { key: 'geo', label: 'OLS GeoJSON', ext: 'GEOJSON', icon: FaFileCode, color: 'border-cyan-500/30 hover:border-cyan-400/60', iconColor: 'text-cyan-400', fn: onOpenGeoJSON },
            ].map(({ key, label, ext, icon: Icon, color, iconColor, fn }) => (
              <button
                key={key}
                disabled={!hasData || downloadLoading[key]}
                onClick={() => handleDownload(key, fn)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg glass-card border ${color} text-xs font-semibold text-slate-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed group`}
              >
                <div className="flex items-center gap-2.5">
                  {downloadLoading[key] ? <FaSpinner className="animate-spin text-sm" /> : <Icon className={`text-sm ${iconColor}`} />}
                  <span>{label}</span>
                </div>
                <span className={`font-mono text-[9px] font-bold ${iconColor} opacity-60`}>.{ext}</span>
              </button>
            ))}
          </div>
        </SidebarSection>
      </div>

      {/* Footer status */}
      <div className="px-4 py-3 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <div className="status-dot bg-emerald-400" />
          <span className="text-[10px] font-mono text-slate-400">FastAPI :8000 Connected</span>
        </div>
      </div>
    </motion.aside>
  );
};

export default PremiumSidebar;
