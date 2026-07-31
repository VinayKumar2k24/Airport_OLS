import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaClock, FaCheckCircle, FaExclamationTriangle, FaSpinner,
  FaChevronDown, FaChevronUp
} from 'react-icons/fa';

const STATUS_ICONS = {
  success: { icon: FaCheckCircle, color: 'text-emerald-400' },
  error: { icon: FaExclamationTriangle, color: 'text-red-400' },
  running: { icon: FaSpinner, color: 'text-cyan-400', spin: true },
  idle: { icon: FaClock, color: 'text-slate-500' },
};

export const AnalysisTimeline = ({ entries = [] }) => {
  const [expanded, setExpanded] = useState(true);

  if (entries.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl overflow-hidden"
    >
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/2 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FaClock className="text-cyan-400 text-[10px]" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Analysis Timeline</span>
          <span className="text-[9px] font-mono text-slate-600">({entries.length})</span>
        </div>
        {expanded ? <FaChevronUp className="text-slate-600 text-[9px]" /> : <FaChevronDown className="text-slate-600 text-[9px]" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-2 max-h-40 overflow-y-auto">
              {entries.map((entry, i) => {
                const status = STATUS_ICONS[entry.status] || STATUS_ICONS.idle;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-2.5"
                  >
                    <div className="relative flex-shrink-0 mt-0.5">
                      {i < entries.length - 1 && (
                        <div className="absolute left-1/2 top-4 w-px h-full bg-slate-800 -translate-x-1/2" />
                      )}
                      <status.icon className={`text-xs ${status.color} ${status.spin ? 'animate-spin' : ''}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold text-slate-300 truncate">{entry.icao} — {entry.runway}</p>
                      <p className="text-[9px] text-slate-500 font-mono">{entry.time}</p>
                      {entry.message && (
                        <p className={`text-[9px] mt-0.5 ${status.color}`}>{entry.message}</p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AnalysisTimeline;
