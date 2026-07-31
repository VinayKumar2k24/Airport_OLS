import React from 'react';
import { FaSatellite, FaGlobe, FaServer } from 'react-icons/fa';

export const Footer = () => {
  return (
    <footer className="w-full bg-navy-950/90 border-t border-slate-800 px-6 py-2.5 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 gap-2 z-30">
      <div className="flex items-center space-x-4">
        <span className="flex items-center space-x-1.5 font-semibold text-slate-300">
          <FaSatellite className="text-cyan-400" />
          <span>Airport OLS Monitoring System v2.0</span>
        </span>
        <span className="hidden md:inline text-slate-600">|</span>
        <span className="hidden md:flex items-center space-x-1.5">
          <FaGlobe className="text-slate-500" />
          <span>CRS: WGS 84 / UTM Zone</span>
        </span>
      </div>

      <div className="flex items-center space-x-3 font-mono text-[11px]">
        <span className="flex items-center space-x-1.5 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          <FaServer className="text-[10px]" />
          <span>Backend Connected: http://127.0.0.1:8000</span>
        </span>
      </div>
    </footer>
  );
};

export default Footer;
