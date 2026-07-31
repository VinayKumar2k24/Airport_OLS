import React from 'react';
import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, RadialBarChart, RadialBar, LineChart, Line
} from 'recharts';

const CHART_COLORS = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#eab308',
  Low: '#22c55e',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-navy-900/95 border border-cyan-500/20 rounded-lg p-2.5 shadow-glass">
      {label && <p className="text-[10px] font-bold text-cyan-400 mb-1.5 uppercase tracking-wider">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-[10px]">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="font-bold text-white">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const CustomPieLegend = ({ data }) => (
  <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 mt-2">
    {data.map(item => (
      <div key={item.name} className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full" style={{ background: CHART_COLORS[item.name] }} />
        <span className="text-[10px] text-slate-400">{item.name}</span>
        <span className="text-[10px] font-bold text-white">{item.value}</span>
      </div>
    ))}
  </div>
);

const SectionTitle = ({ title }) => (
  <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-3 flex items-center gap-2">
    <div className="w-1 h-3 rounded-full bg-cyan-400" />
    {title}
  </h3>
);

export const PremiumCharts = ({ stats }) => {
  if (!stats) return (
    <div className="space-y-4">
      {[1, 2].map(i => (
        <div key={i} className="glass-card rounded-xl p-4">
          <div className="h-3 bg-slate-800 rounded w-1/3 mb-3" />
          <div className="h-44 bg-slate-800/40 rounded-lg animate-pulse" />
        </div>
      ))}
    </div>
  );

  const pieData = [
    { name: 'Critical', value: stats.critical || 0 },
    { name: 'High', value: stats.high || 0 },
    { name: 'Medium', value: stats.medium || 0 },
    { name: 'Low', value: stats.low || 0 },
  ].filter(d => d.value > 0);

  const barData = [
    { name: 'Critical', count: stats.critical || 0, fill: '#ef4444' },
    { name: 'High', count: stats.high || 0, fill: '#f97316' },
    { name: 'Medium', count: stats.medium || 0, fill: '#eab308' },
    { name: 'Low', count: stats.low || 0, fill: '#22c55e' },
  ];

  const total = stats.total || 1;
  const violations = (stats.critical || 0) + (stats.high || 0) + (stats.medium || 0) + (stats.low || 0);
  const complianceRate = ((total - violations) / total) * 100;

  const complianceData = [
    { name: 'Compliant', value: complianceRate, fill: '#22c55e' },
    { name: 'Violations', value: 100 - complianceRate, fill: '#ef4444' },
  ];

  return (
    <div className="space-y-4">
      {/* Risk Distribution Pie Chart */}
      {pieData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4"
        >
          <SectionTitle title="Risk Distribution" />
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="45%"
                outerRadius={70}
                innerRadius={35}
                paddingAngle={3}
                dataKey="value"
                animationBegin={0}
                animationDuration={1200}
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={CHART_COLORS[entry.name]} stroke="rgba(0,0,0,0.3)" strokeWidth={1} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <CustomPieLegend data={pieData} />
        </motion.div>
      )}

      {/* Risk Count Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="glass-card rounded-xl p-4"
      >
        <SectionTitle title="Risk Count Analysis" />
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" name="Count" radius={[3, 3, 0, 0]} maxBarSize={30} animationDuration={1200}>
              {barData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Compliance Gauge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="glass-card rounded-xl p-4"
      >
        <SectionTitle title="Compliance Rate" />
        <div className="flex items-center justify-center gap-6">
          <div className="relative flex items-center justify-center w-24 h-24">
            <ResponsiveContainer width={96} height={96}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="55%" outerRadius="95%" data={complianceData} startAngle={90} endAngle={-270}>
                <RadialBar dataKey="value" background={{ fill: 'rgba(255,255,255,0.03)' }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-lg font-bold font-mono text-emerald-400">{complianceRate.toFixed(0)}%</span>
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[10px] text-slate-400">Compliant</span>
              </div>
              <span className="text-sm font-bold text-emerald-300 ml-3.5">{complianceRate.toFixed(1)}%</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-[10px] text-slate-400">Violations</span>
              </div>
              <span className="text-sm font-bold text-red-300 ml-3.5">{(100 - complianceRate).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PremiumCharts;
