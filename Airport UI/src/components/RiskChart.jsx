import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';

const RISK_COLORS = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#eab308',
  Low: '#22c55e',
};

export const RiskChart = ({ csvData = [] }) => {
  // 1. Prepare Pie Chart Data (Risk Level Distribution)
  const riskCounts = {
    Critical: csvData.filter((r) => r.risk_level === 'Critical').length,
    High: csvData.filter((r) => r.risk_level === 'High').length,
    Medium: csvData.filter((r) => r.risk_level === 'Medium').length,
    Low: csvData.filter((r) => r.risk_level === 'Low').length,
  };

  const pieData = Object.entries(riskCounts)
    .filter(([_, count]) => count > 0)
    .map(([name, value]) => ({ name, value }));

  // Fallback if pieData is empty
  const defaultPieData = [
    { name: 'Critical', value: 3 },
    { name: 'High', value: 5 },
    { name: 'Medium', value: 8 },
    { name: 'Low', value: 12 },
  ];

  const activePieData = pieData.length > 0 ? pieData : defaultPieData;

  // 2. Prepare Bar Chart Data (Top 6 Height Violations)
  const barData = csvData.length > 0
    ? csvData
        .slice(0, 6)
        .map((item) => ({
          name: item.building_id || 'ID',
          Allowed: Number(item.allowed_height) || 0,
          Detected: Number(item.detected_height) || 0,
        }))
    : [
        { name: 'BLD-01', Allowed: 30, Detected: 42 },
        { name: 'BLD-02', Allowed: 25, Detected: 38 },
        { name: 'BLD-03', Allowed: 45, Detected: 48 },
        { name: 'BLD-04', Allowed: 20, Detected: 31 },
        { name: 'BLD-05', Allowed: 50, Detected: 55 },
        { name: 'BLD-06', Allowed: 15, Detected: 22 },
      ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
      {/* Pie Chart: Risk Distribution */}
      <div className="glass-card p-4 rounded-xl border border-slate-700/50 flex flex-col">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>Risk Level Distribution</span>
        </h4>
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={activePieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {activePieData.map((entry) => (
                  <Cell key={entry.name} fill={RISK_COLORS[entry.name] || '#38bdf8'} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#0b132b', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }} 
              />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle" 
                wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart: Allowed vs Detected Heights */}
      <div className="glass-card p-4 rounded-xl border border-slate-700/50 flex flex-col">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span>Height Compliance Comparison (m)</span>
        </h4>
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0b132b', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }} 
              />
              <Bar dataKey="Allowed" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Detected" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default RiskChart;
