import React from 'react';
import { FaLocationArrow } from 'react-icons/fa';

export const RunwaySelector = ({ 
  runways = ['Sep-27', '09-27', '14-32'], 
  selectedRunway, 
  onSelectRunway, 
  disabled = false 
}) => {
  return (
    <div className="flex flex-col space-y-1.5">
      <label className="text-xs font-semibold text-slate-400 flex items-center space-x-1.5 uppercase tracking-wider">
        <FaLocationArrow className="text-cyan-400 rotate-45" />
        <span>Runway Target</span>
      </label>
      <select
        value={selectedRunway}
        onChange={(e) => onSelectRunway(e.target.value)}
        disabled={disabled || runways.length === 0}
        className="w-full bg-navy-950/80 border border-slate-700/60 hover:border-cyan-500/50 focus:border-cyan-400 text-slate-100 text-sm font-semibold rounded-lg px-3 py-2 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed shadow-inner"
      >
        {runways.map((rw) => (
          <option key={rw} value={rw} className="bg-navy-900 text-slate-100">
            {rw}
          </option>
        ))}
      </select>
    </div>
  );
};

export default RunwaySelector;
