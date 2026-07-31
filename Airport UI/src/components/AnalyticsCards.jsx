import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import {
  FaExclamationTriangle, FaExclamation, FaInfo, FaCheckCircle,
  FaRulerVertical, FaDrawPolygon, FaShieldAlt, FaBuilding,
  FaArrowUp, FaArrowDown, FaMinus
} from 'react-icons/fa';
import { MdHeight, MdAreaChart } from 'react-icons/md';

const CARDS_CONFIG = [
  {
    key: 'critical', label: 'Critical Risk', icon: FaExclamationTriangle,
    color: 'text-red-400', border: 'border-red-500/20', bg: 'bg-red-500/5', glow: 'glow-red',
    gradient: 'from-red-900/20 to-red-950/5', accessor: s => s.critical || 0, suffix: '',
  },
  {
    key: 'high', label: 'High Risk', icon: FaExclamation,
    color: 'text-orange-400', border: 'border-orange-500/20', bg: 'bg-orange-500/5', glow: 'glow-orange',
    gradient: 'from-orange-900/20 to-orange-950/5', accessor: s => s.high || 0, suffix: '',
  },
  {
    key: 'medium', label: 'Medium Risk', icon: FaInfo,
    color: 'text-yellow-400', border: 'border-yellow-500/20', bg: 'bg-yellow-500/5', glow: 'glow-yellow',
    gradient: 'from-yellow-900/20 to-yellow-950/5', accessor: s => s.medium || 0, suffix: '',
  },
  {
    key: 'low', label: 'Low Risk', icon: FaCheckCircle,
    color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/5', glow: 'glow-green',
    gradient: 'from-emerald-900/20 to-emerald-950/5', accessor: s => s.low || 0, suffix: '',
  },
  {
    key: 'maxHeight', label: 'Max Violation Height', icon: MdHeight,
    color: 'text-cyan-400', border: 'border-cyan-500/20', bg: 'bg-cyan-500/5', glow: 'glow-cyan',
    gradient: 'from-cyan-900/20 to-cyan-950/5', accessor: s => parseFloat(s.maxHeight || 0).toFixed(1), suffix: 'm',
  },
  {
    key: 'avgArea', label: 'Avg Footprint Area', icon: MdAreaChart,
    color: 'text-blue-400', border: 'border-blue-500/20', bg: 'bg-blue-500/5', glow: 'glow-blue',
    gradient: 'from-blue-900/20 to-blue-950/5', accessor: s => parseFloat(s.avgArea || 0).toFixed(0), suffix: 'm²',
  },
  {
    key: 'totalStructures', label: 'Total Structures', icon: FaBuilding,
    color: 'text-purple-400', border: 'border-purple-500/20', bg: 'bg-purple-500/5', glow: 'glow-blue',
    gradient: 'from-purple-900/20 to-purple-950/5', accessor: s => s.total || 0, suffix: '',
  },
  {
    key: 'compliance', label: 'Compliance Rate', icon: FaShieldAlt,
    color: 'text-teal-400', border: 'border-teal-500/20', bg: 'bg-teal-500/5', glow: 'glow-cyan',
    gradient: 'from-teal-900/20 to-teal-950/5', accessor: s => {
      const total = (s.total || 0);
      const violations = (s.critical || 0) + (s.high || 0) + (s.medium || 0) + (s.low || 0);
      if (!total) return '0.0';
      return (((total - violations) / total) * 100).toFixed(1);
    }, suffix: '%',
  },
];

const StatCard = ({ config, stats, index }) => {
  const value = config.accessor(stats);
  const numValue = parseFloat(value) || 0;

  const containerVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, delay: index * 0.06, ease: 'easeOut' } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.02, y: -2 }}
      className={`glass-card rounded-xl p-3.5 border ${config.border} ${config.glow} relative overflow-hidden cursor-default`}
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} pointer-events-none`} />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-2">
          <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center`}>
            <config.icon className={`${config.color} text-sm`} />
          </div>
          <div className={`text-[9px] font-mono font-bold uppercase tracking-wider ${config.color} opacity-60`}>
            {config.suffix || 'COUNT'}
          </div>
        </div>

        <div className="mt-1">
          <div className={`text-2xl font-bold font-mono ${config.color} leading-none`}>
            {numValue > 0 ? (
              <CountUp end={numValue} duration={1.5} decimals={config.suffix === 'm' || config.suffix === '%' || config.suffix === 'm²' ? 1 : 0} />
            ) : (
              <span className="text-slate-500">—</span>
            )}
            {numValue > 0 && <span className="text-base ml-0.5 opacity-70">{config.suffix}</span>}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-medium">{config.label}</div>
        </div>
      </div>
    </motion.div>
  );
};

export const AnalyticsCards = ({ stats }) => {
  if (!stats) return (
    <div className="grid grid-cols-2 gap-2">
      {CARDS_CONFIG.map((config, i) => (
        <div key={config.key} className={`glass-card rounded-xl p-3.5 border ${config.border} animate-pulse`}>
          <div className="w-8 h-8 rounded-lg bg-slate-800 mb-2" />
          <div className="h-6 bg-slate-800 rounded w-3/4 mb-1" />
          <div className="h-3 bg-slate-800/60 rounded w-1/2" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="grid grid-cols-2 gap-2">
      {CARDS_CONFIG.map((config, i) => (
        <StatCard key={config.key} config={config} stats={stats} index={i} />
      ))}
    </div>
  );
};

export default AnalyticsCards;
