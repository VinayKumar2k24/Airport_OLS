import React from 'react';
import { FaFileAlt, FaFileCsv, FaFileCode, FaDownload } from 'react-icons/fa';

export const DownloadPanel = ({ 
  selectedIcao, 
  onDownloadTXT, 
  onDownloadCSV, 
  onOpenGeoJSON,
  disabled = false 
}) => {
  return (
    <div className="glass-card p-3.5 rounded-xl border border-slate-700/50 flex flex-col space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
        <FaDownload className="text-cyan-400" />
        <span>Export Artifacts</span>
      </h3>

      <div className="flex flex-col space-y-2">
        {/* Download TXT Report */}
        <button
          onClick={onDownloadTXT}
          disabled={disabled}
          className="w-full flex items-center justify-between p-2.5 rounded-lg bg-navy-950/60 hover:bg-navy-800 border border-slate-800 hover:border-amber-500/40 text-xs font-semibold text-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="flex items-center space-x-2">
            <FaFileAlt className="text-amber-400 text-sm group-hover:scale-110 transition-transform" />
            <span>Download TXT Report</span>
          </div>
          <span className="text-[10px] text-amber-400/80 font-mono uppercase">.TXT</span>
        </button>

        {/* Download CSV Summary */}
        <button
          onClick={onDownloadCSV}
          disabled={disabled}
          className="w-full flex items-center justify-between p-2.5 rounded-lg bg-navy-950/60 hover:bg-navy-800 border border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="flex items-center space-x-2">
            <FaFileCsv className="text-emerald-400 text-sm group-hover:scale-110 transition-transform" />
            <span>Download CSV Summary</span>
          </div>
          <span className="text-[10px] text-emerald-400/80 font-mono uppercase">.CSV</span>
        </button>

        {/* Open GeoJSON */}
        <button
          onClick={onOpenGeoJSON}
          disabled={disabled}
          className="w-full flex items-center justify-between p-2.5 rounded-lg bg-navy-950/60 hover:bg-navy-800 border border-slate-800 hover:border-cyan-500/40 text-xs font-semibold text-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="flex items-center space-x-2">
            <FaFileCode className="text-cyan-400 text-sm group-hover:scale-110 transition-transform" />
            <span>Open GeoJSON</span>
          </div>
          <span className="text-[10px] text-cyan-400/80 font-mono uppercase">.GEOJSON</span>
        </button>
      </div>
    </div>
  );
};

export default DownloadPanel;
