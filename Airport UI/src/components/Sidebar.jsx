import React from 'react';
import AirportSelector from './AirportSelector';
import RunwaySelector from './RunwaySelector';
import AnalyzeButton from './AnalyzeButton';
import LayerControl from './LayerControl';
import DownloadPanel from './DownloadPanel';

export const Sidebar = ({
  airports,
  selectedIcao,
  onSelectAirport,
  runways,
  selectedRunway,
  onSelectRunway,
  onAnalyze,
  isAnalyzing,
  layers,
  onToggleLayer,
  onDownloadTXT,
  onDownloadCSV,
  onOpenGeoJSON,
}) => {
  return (
    <aside className="w-full lg:w-80 bg-navy-900/80 backdrop-blur-md border-r border-slate-700/50 p-4 flex flex-col space-y-5 overflow-y-auto shrink-0 shadow-xl">
      {/* Controls Header */}
      <div className="border-b border-slate-700/50 pb-3">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-200">
          Analysis Parameters
        </h2>
        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
          Configure airport parameters and vector surface layers.
        </p>
      </div>

      {/* Airport & Runway Selectors */}
      <div className="space-y-4">
        <AirportSelector
          airports={airports}
          selectedIcao={selectedIcao}
          onSelectAirport={onSelectAirport}
          disabled={isAnalyzing}
        />

        <RunwaySelector
          runways={runways}
          selectedRunway={selectedRunway}
          onSelectRunway={onSelectRunway}
          disabled={isAnalyzing}
        />

        {/* Analyze Button */}
        <AnalyzeButton
          onAnalyze={onAnalyze}
          isAnalyzing={isAnalyzing}
          disabled={!selectedIcao || !selectedRunway}
        />
      </div>

      {/* Layer Control Widget */}
      <LayerControl
        layers={layers}
        onToggleLayer={onToggleLayer}
      />

      {/* Download Export Section */}
      <DownloadPanel
        selectedIcao={selectedIcao}
        onDownloadTXT={onDownloadTXT}
        onDownloadCSV={onDownloadCSV}
        onOpenGeoJSON={onOpenGeoJSON}
        disabled={isAnalyzing}
      />
    </aside>
  );
};

export default Sidebar;
