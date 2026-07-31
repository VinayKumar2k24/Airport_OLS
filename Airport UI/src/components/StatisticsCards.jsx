import React from 'react';
import { motion } from 'framer-motion';
import { 
  FaBuilding, 
  FaExclamationTriangle, 
  FaExclamationCircle, 
  FaInfoCircle, 
  FaCheckCircle, 
  FaRulerVertical, 
  FaVectorSquare 
} from 'react-icons/fa';

export const StatisticsCards = ({ summary }) => {
  if (!summary) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="glass-card p-3 rounded-xl border border-slate-700/40 text-center animate-pulse">
            <div className="h-3 w-16 bg-slate-700/50 rounded mx-auto mb-2" />
            <div className="h-6 w-10 bg-slate-700/50 rounded mx-auto" />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Footprints',
      value: summary.detectedStructuresCount || 0,
      unit: '',
      icon: FaBuilding,
      color: 'text-cyan-400',
      borderColor: 'border-cyan-500/30',
      bgColor: 'bg-cyan-500/10',
    },
    {
      title: 'Critical Risks',
      value: summary.criticalCount || 0,
      unit: '',
      icon: FaExclamationTriangle,
      color: 'text-red-400',
      borderColor: 'border-red-500/30',
      bgColor: 'bg-red-500/10',
    },
    {
      title: 'High Risks',
      value: summary.highCount || 0,
      unit: '',
      icon: FaExclamationCircle,
      color: 'text-amber-400',
      borderColor: 'border-amber-500/30',
      bgColor: 'bg-amber-500/10',
    },
    {
      title: 'Medium Risks',
      value: summary.mediumCount || 0,
      unit: '',
      icon: FaInfoCircle,
      color: 'text-yellow-300',
      borderColor: 'border-yellow-500/30',
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: 'Low Risks',
      value: summary.lowCount || 0,
      unit: '',
      icon: FaCheckCircle,
      color: 'text-emerald-400',
      borderColor: 'border-emerald-500/30',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Max Height Violation',
      value: summary.maxHeight ? summary.maxHeight.toFixed(1) : 0,
      unit: 'm',
      icon: FaRulerVertical,
      color: 'text-orange-400',
      borderColor: 'border-orange-500/30',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'Avg Footprint Area',
      value: summary.avgArea ? summary.avgArea.toFixed(1) : 0,
      unit: 'm²',
      icon: FaVectorSquare,
      color: 'text-blue-400',
      borderColor: 'border-blue-500/30',
      bgColor: 'bg-blue-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`glass-card p-3 rounded-xl border ${card.borderColor} relative overflow-hidden group hover:scale-[1.03] transition-transform duration-200`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
                {card.title}
              </span>
              <div className={`p-1.5 rounded-lg ${card.bgColor}`}>
                <Icon className={`text-xs ${card.color}`} />
              </div>
            </div>

            <div className="flex items-baseline space-x-1">
              <span className="text-xl font-extrabold text-white tracking-tight">
                {card.value}
              </span>
              {card.unit && (
                <span className="text-xs font-semibold text-slate-400">
                  {card.unit}
                </span>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default StatisticsCards;
