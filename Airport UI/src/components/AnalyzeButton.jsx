import React from 'react';
import { FaPlay, FaSpinner } from 'react-icons/fa';

export const AnalyzeButton = ({ onAnalyze, isAnalyzing, disabled = false }) => {
  return (
    <button
      onClick={onAnalyze}
      disabled={disabled || isAnalyzing}
      className={`w-full relative group overflow-hidden py-3 px-4 rounded-xl font-bold text-sm tracking-wider uppercase transition-all duration-300 shadow-lg ${
        isAnalyzing || disabled
          ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
          : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-400 text-white border border-cyan-400/30 hover:shadow-cyan-500/30 hover:scale-[1.02] active:scale-[0.98]'
      }`}
    >
      <div className="flex items-center justify-center space-x-2 relative z-10">
        {isAnalyzing ? (
          <>
            <FaSpinner className="animate-spin text-cyan-300 text-base" />
            <span>Analyzing OLS...</span>
          </>
        ) : (
          <>
            <FaPlay className="text-xs text-white group-hover:translate-x-0.5 transition-transform" />
            <span>Run OLS Analysis</span>
          </>
        )}
      </div>

      {/* Glossy overlay effect */}
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </button>
  );
};

export default AnalyzeButton;
