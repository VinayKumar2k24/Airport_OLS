import React from 'react';
import { FaLayerGroup, FaGlobeAmericas, FaBuilding, FaTag, FaMap } from 'react-icons/fa';

export const LayerControl = ({ layers, onToggleLayer }) => {
  const controls = [
    { key: 'olsSurfaces', label: 'OLS Surfaces', icon: FaLayerGroup, color: 'text-cyan-400' },
    { key: 'encroachments', label: 'Encroachments', icon: FaBuilding, color: 'text-red-400' },
    { key: 'labels', label: 'Labels', icon: FaTag, color: 'text-amber-400' },
    { key: 'satelliteView', label: 'Satellite View', icon: FaGlobeAmericas, color: 'text-blue-400' },
    { key: 'terrainView', label: 'Terrain View', icon: FaMap, color: 'text-emerald-400' },
  ];

  return (
    <div className="glass-card p-3.5 rounded-xl border border-slate-700/50 flex flex-col space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
        <FaLayerGroup className="text-cyan-400" />
        <span>Layer Controls</span>
      </h3>

      <div className="space-y-2">
        {controls.map((ctrl) => {
          const Icon = ctrl.icon;
          return (
            <label
              key={ctrl.key}
              className="flex items-center justify-between p-2 rounded-lg bg-navy-950/60 hover:bg-navy-800/80 border border-slate-800 hover:border-slate-700/80 cursor-pointer transition-colors"
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={`text-sm ${ctrl.color}`} />
                <span className="text-xs font-medium text-slate-200">{ctrl.label}</span>
              </div>
              <input
                type="checkbox"
                checked={layers[ctrl.key]}
                onChange={() => onToggleLayer(ctrl.key)}
                className="w-4 h-4 rounded bg-navy-900 border-slate-700 text-cyan-500 focus:ring-cyan-400 focus:ring-offset-navy-950 cursor-pointer"
              />
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default LayerControl;
