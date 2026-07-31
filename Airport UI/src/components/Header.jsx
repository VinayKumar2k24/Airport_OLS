import React from 'react';
import { FaPlane, FaSatellite, FaMoon, FaSun, FaCircle } from 'react-icons/fa';

export const Header = ({ 
  selectedIcao, 
  status = 'Standby', 
  isDarkMode = true, 
  onToggleTheme 
}) => {
  return (
    <header className="w-full bg-navy-900/90 backdrop-blur-md border-b border-slate-700/50 px-6 py-3 flex items-center justify-between z-30 sticky top-0 shadow-lg shadow-black/20">
      {/* Brand & Logo */}
      <div className="flex items-center space-x-3">
        <div className="bg-gradient-to-tr from-cyan-500 to-blue-600 p-2.5 rounded-xl shadow-lg shadow-cyan-500/20 text-white animate-pulse">
          <FaPlane className="text-xl transform -rotate-45" />
        </div>
        <div>
          <h1 className="text-lg font-extrabold tracking-wide bg-gradient-to-r from-white via-slate-200 to-cyan-400 bg-clip-text text-transparent">
            Airport OLS Monitoring System
          </h1>
          <div className="flex items-center space-x-2 text-xs text-cyan-400 font-semibold">
            <FaSatellite className="text-[10px]" />
            <span>SATELLITE OBSTACLE MONITORING</span>
          </div>
        </div>
      </div>

      {/* Dynamic Status & Info Badges */}
      <div className="flex items-center space-x-4">
        {/* Selected ICAO badge */}
        {selectedIcao && (
          <div className="bg-navy-800/80 border border-cyan-500/30 px-3 py-1 rounded-lg flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-medium">ICAO:</span>
            <span className="text-sm font-bold text-cyan-accent tracking-wider">{selectedIcao}</span>
          </div>
        )}

        {/* Status Indicator */}
        <div className="bg-navy-800/80 border border-slate-700/50 px-3 py-1 rounded-lg flex items-center space-x-2">
          <FaCircle className={`text-[8px] ${
            status === 'Processing' ? 'text-amber-400 animate-ping' : 
            status === 'Live' ? 'text-emerald-400 animate-pulse' : 'text-slate-400'
          }`} />
          <span className="text-xs font-semibold text-slate-200">{status}</span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-lg bg-navy-800 hover:bg-navy-700 border border-slate-700 text-amber-400 hover:text-amber-300 transition-colors shadow-inner"
          title={isDarkMode ? "Switch to Light Theme" : "Switch to Dark Theme"}
        >
          {isDarkMode ? <FaSun className="text-sm" /> : <FaMoon className="text-sm" />}
        </button>
      </div>
    </header>
  );
};

export default Header;
