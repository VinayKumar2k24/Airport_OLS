import React from 'react';
import { FaBuilding } from 'react-icons/fa';

export const AirportSelector = ({ 
  airports = ['VABB', 'VIDP', 'VOBL', 'VECC', 'VOHS', 'KJFK', 'KORD'], 
  selectedIcao, 
  onSelectAirport, 
  disabled = false 
}) => {
  return (
    <div className="flex flex-col space-y-1.5">
      <label className="text-xs font-semibold text-slate-400 flex items-center space-x-1.5 uppercase tracking-wider">
        <FaBuilding className="text-cyan-400" />
        <span>Airport ICAO</span>
      </label>
      <select
        value={selectedIcao}
        onChange={(e) => onSelectAirport(e.target.value)}
        disabled={disabled}
        className="w-full bg-navy-950/80 border border-slate-700/60 hover:border-cyan-500/50 focus:border-cyan-400 text-slate-100 text-sm font-semibold rounded-lg px-3 py-2 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed shadow-inner"
      >
        {airports.map((icao) => (
          <option key={icao} value={icao} className="bg-navy-900 text-slate-100">
            {icao}
          </option>
        ))}
      </select>
    </div>
  );
};

export default AirportSelector;
