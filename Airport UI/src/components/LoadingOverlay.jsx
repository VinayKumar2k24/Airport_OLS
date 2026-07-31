import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdOutlineRadar, MdSatelliteAlt } from 'react-icons/md';
import { FaPlane } from 'react-icons/fa';

export const LoadingOverlay = ({ isVisible, progress = 0, status = '' }) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center"
        style={{ background: 'rgba(8, 19, 31, 0.95)', backdropFilter: 'blur(12px)' }}
      >
        {/* Grid background */}
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />

        {/* Scanning line */}
        <motion.div
          animate={{ y: ['0vh', '100vh'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent pointer-events-none"
        />

        {/* Radar container */}
        <div className="relative w-64 h-64 flex items-center justify-center mb-8">
          {/* Outer rings */}
          {[1, 0.75, 0.5, 0.25].map((scale, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-cyan-500/20"
              style={{ width: `${scale * 100}%`, height: `${scale * 100}%` }}
            />
          ))}

          {/* Cross hairs */}
          <div className="absolute w-full h-px bg-cyan-500/15" />
          <div className="absolute w-px h-full bg-cyan-500/15" />

          {/* Radar sweep */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full overflow-hidden"
          >
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'conic-gradient(from 0deg, rgba(0, 200, 255, 0) 0deg, rgba(0, 200, 255, 0.15) 60deg, rgba(0, 200, 255, 0.4) 90deg, rgba(0, 200, 255, 0) 91deg)',
              }}
            />
          </motion.div>

          {/* Center dot */}
          <div className="absolute w-3 h-3 rounded-full bg-cyan-400 animate-ping-slow" />
          <div className="absolute w-2 h-2 rounded-full bg-cyan-300 z-10" />

          {/* Animated blip dots */}
          {[
            { x: '30%', y: '25%', delay: 0.5 },
            { x: '65%', y: '55%', delay: 1.2 },
            { x: '20%', y: '65%', delay: 2.1 },
            { x: '75%', y: '30%', delay: 0.9 },
          ].map((blip, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
              transition={{ duration: 3, delay: blip.delay, repeat: Infinity }}
              className="absolute w-2 h-2 rounded-full bg-red-400"
              style={{ left: blip.x, top: blip.y }}
            />
          ))}

          {/* Radar icon center */}
          <MdOutlineRadar className="absolute text-cyan-400/10 text-[180px]" />
        </div>

        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center space-y-2 max-w-sm"
        >
          <h2 className="text-lg font-bold tracking-wider text-white">
            Running OLS Compliance Analysis
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Processing satellite imagery and computing<br />obstacle limitation surfaces...
          </p>
          {status && (
            <p className="text-xs font-mono text-cyan-400 mt-2">{status}</p>
          )}
        </motion.div>

        {/* Progress Bar */}
        <div className="mt-6 w-72">
          <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1.5">
            <span>Processing...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: '5%' }}
              animate={{ width: `${Math.max(5, progress)}%` }}
              transition={{ duration: 0.5 }}
              className="h-full progress-bar rounded-full"
            />
          </div>
        </div>

        {/* Subtitle */}
        <p className="text-[10px] font-mono text-slate-600 mt-4 uppercase tracking-widest">
          ICAO Annex 14 • OLS Computation Engine
        </p>
      </motion.div>
    )}
  </AnimatePresence>
);

export default LoadingOverlay;
