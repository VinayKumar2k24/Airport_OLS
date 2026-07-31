import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaPlane, FaSatellite, FaSignal, FaBell, FaUser, FaMoon, FaSun,
  FaCircle, FaServer, FaWifi
} from 'react-icons/fa';
import { MdFlightTakeoff } from 'react-icons/md';

export const TopNav = ({ selectedIcao, selectedRunway, isDarkMode, onToggleTheme, backendConnected = true }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifications] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = currentTime.toLocaleTimeString('en-US', { hour12: false });
  const dateStr = currentTime.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

  return (
    <nav className="w-full h-14 glass border-b border-cyan-500/10 flex items-center px-4 gap-3 z-50 shrink-0 relative overflow-hidden">
      {/* Subtle scan line */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
      </div>

      {/* Brand */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="relative">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-neon-cyan animate-pulse-neon">
            <MdFlightTakeoff className="text-white text-base" />
          </div>
        </div>
        <div className="hidden md:block">
          <h1 className="text-sm font-bold tracking-wider bg-gradient-to-r from-white to-cyan-300 bg-clip-text text-transparent leading-none">
            Airport OLS Monitoring System
          </h1>
          <p className="text-[9px] font-mono text-cyan-400/60 tracking-widest uppercase mt-0.5">
            ICAO Annex 14 • Obstacle Limitation Surface Controller
          </p>
        </div>
      </div>

      {/* ICAO & Runway Badges */}
      <div className="flex items-center gap-2 ml-4">
        {selectedIcao && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20"
          >
            <FaSatellite className="text-cyan-400 text-[10px]" />
            <span className="text-[11px] font-mono font-bold text-cyan-300 tracking-widest">{selectedIcao}</span>
          </motion.div>
        )}
        {selectedRunway && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20">
            <FaPlane className="text-blue-300 text-[10px] -rotate-45" />
            <span className="text-[11px] font-mono font-semibold text-blue-200">RWY {selectedRunway}</span>
          </div>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right Items */}
      <div className="flex items-center gap-3">
        {/* Time */}
        <div className="hidden lg:flex flex-col items-end">
          <span className="text-sm font-mono font-semibold text-white tabular-nums">{timeStr}</span>
          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">{dateStr}</span>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-700" />

        {/* Backend Status */}
        <div className="flex items-center gap-1.5">
          <div className={`status-dot ${backendConnected ? 'bg-emerald-400' : 'bg-red-400'}`} />
          <span className={`text-[10px] font-mono font-semibold ${backendConnected ? 'text-emerald-400' : 'text-red-400'}`}>
            {backendConnected ? 'CONNECTED' : 'OFFLINE'}
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-700" />

        {/* Notification Bell */}
        <button className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors">
          <FaBell className="text-slate-300 text-sm" />
          {notifications > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
              {notifications}
            </span>
          )}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
        >
          {isDarkMode ? <FaSun className="text-amber-300 text-sm" /> : <FaMoon className="text-slate-300 text-sm" />}
        </button>

        {/* User Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-neon-cyan">
          <FaUser className="text-white text-[11px]" />
        </div>
      </div>
    </nav>
  );
};

export default TopNav;
