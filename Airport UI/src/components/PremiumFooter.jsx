import React from 'react';
import { FaPlane, FaGlobe, FaCode, FaDatabase } from 'react-icons/fa';
import { MdFlightTakeoff } from 'react-icons/md';

export const PremiumFooter = ({ selectedIcao }) => (
  <footer className="w-full h-10 glass border-t border-cyan-500/8 flex items-center px-4 gap-4 shrink-0 overflow-hidden">
    <div className="flex items-center gap-2">
      <MdFlightTakeoff className="text-cyan-400 text-xs" />
      <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Airport OLS v2.0</span>
    </div>

    <div className="w-px h-4 bg-slate-800" />

    <div className="flex items-center gap-1.5">
      <FaGlobe className="text-slate-600 text-[9px]" />
      <span className="text-[9px] font-mono text-slate-500">ICAO Annex 14 • WGS-84 • EPSG:4326</span>
    </div>

    <div className="flex-1" />

    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1.5">
        <FaDatabase className="text-emerald-400 text-[9px]" />
        <span className="text-[9px] font-mono text-slate-500">FastAPI :8000</span>
        <span className="text-[9px] font-mono text-emerald-400 font-bold">● ONLINE</span>
      </div>
      <div className="w-px h-4 bg-slate-800" />
      <div className="flex items-center gap-1.5">
        <FaCode className="text-slate-600 text-[9px]" />
        <span className="text-[9px] font-mono text-slate-500">React 18 + Vite 4 + Tailwind CSS 3</span>
      </div>
      {selectedIcao && (
        <>
          <div className="w-px h-4 bg-slate-800" />
          <span className="text-[9px] font-mono text-cyan-400/60">Active: {selectedIcao}</span>
        </>
      )}
    </div>
  </footer>
);

export default PremiumFooter;
