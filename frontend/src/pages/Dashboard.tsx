import { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { apiService } from '../services/api';
import type { TelemetryReading, DailySummary, Forecast } from '../types/api';
import SimulationControl from '../components/SimulationControl';

export default function Dashboard() {
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [telemetryData, setTelemetryData] = useState<TelemetryReading[]>([]);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h'>('24h');
  const [forecastDays, setForecastDays] = useState<7 | 14 | 30>(7);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [timeRange, forecastDays]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Calculate time range
      const now = new Date();
      const hoursAgo = timeRange === '1h' ? 1 : timeRange === '6h' ? 6 : 24;
      const fromTime = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

      // Fetch all data in parallel
      const [summaryData, telemetryData, forecastData] = await Promise.all([
        apiService.getTodaySummary(),
        apiService.getTelemetryReadings({
          from_time: fromTime.toISOString(),
          limit: 1000,
        }),
        apiService.getForecast(forecastDays, 7),
      ]);

      setSummary(summaryData);
      setTelemetryData(telemetryData.reverse()); // Reverse to get chronological order
      setForecast(forecastData);
      setError(null);
    } catch (err) {
      setError('Failed to load data. Make sure the backend is running on port 8000.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Format data for charts
  const chartData = telemetryData.map((reading) => ({
    time: new Date(reading.timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    solar: reading.solar_power_w,
    wind: reading.wind_power_w,
    load: reading.load_power_w,
    batterySOC: reading.battery_soc_pct,
    batteryPower: reading.battery_charge_power_w,
  }));

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-slate-400">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-6">
        <h3 className="text-xl font-bold text-red-400 mb-2">Error</h3>
        <p className="text-red-300">{error}</p>
        <button
          onClick={loadData}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!summary) return null;

  // Calculate energy distribution for pie chart
  const energyDistribution = summary ? [
    { name: 'Solar', value: summary.solar_energy_wh_today / 1000, color: '#eab308' },
    { name: 'Wind', value: summary.wind_energy_wh_today / 1000, color: '#3b82f6' },
    { name: 'Battery', value: summary.battery_discharge_energy_wh_today / 1000, color: '#a855f7' },
  ].filter(item => item.value > 0) : [];

  return (
    <div className="space-y-8">
      {/* Minimal Header with Icons */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-700">
        <div className="flex items-center space-x-4">
          {/* Solar + Wind Icon */}
          <div className="relative">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-yellow-500">
              <circle cx="12" cy="12" r="4" fill="currentColor"/>
              <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-blue-500 absolute -bottom-2 -right-2">
              <path d="M9.59 4.59A2 2 0 1111 8H2m10.59 11.41A2 2 0 0014 16v-2m-6-4a2 2 0 012 2v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h2 className="text-4xl font-light text-white tracking-tight">Energy Dashboard</h2>
            <p className="text-slate-500 mt-2 text-sm">Real-time hybrid system monitoring</p>
          </div>
        </div>
        <button
          onClick={loadData}
          className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-full transition-all text-slate-300 text-sm font-medium border border-slate-700"
        >
          <span className="text-lg">↻</span> Refresh
        </button>
      </div>

      {/* Simulation Control Panel */}
      <SimulationControl />

      {/* Energy Usage Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Energy Used Today */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700">
          <div className="flex items-center space-x-3 mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-green-500">
              <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
            <h3 className="text-xl font-light text-white">Energy Used Today</h3>
          </div>
          
          <div className="space-y-6">
            {/* Solar Energy Used */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-xl flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-yellow-400">
                      <circle cx="12" cy="12" r="4" fill="currentColor"/>
                      <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Solar Energy</p>
                    <p className="text-2xl font-light text-white">{(summary.solar_energy_wh_today / 1000).toFixed(2)} <span className="text-sm text-slate-400">kWh</span></p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Current</p>
                  <p className="text-lg text-yellow-400">{summary.current_solar_power_w.toFixed(0)} W</p>
                </div>
              </div>
              <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (summary.solar_energy_wh_today / summary.load_energy_wh_today) * 100)}%` }}
                />
              </div>
            </div>

            {/* Wind Energy Used */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-blue-400">
                      <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 0 0 14 16v-2m-6-4a2 2 0 0 1 2 2v8m-2-6h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Wind Energy</p>
                    <p className="text-2xl font-light text-white">{(summary.wind_energy_wh_today / 1000).toFixed(2)} <span className="text-sm text-slate-400">kWh</span></p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Current</p>
                  <p className="text-lg text-blue-400">{summary.current_wind_power_w.toFixed(0)} W</p>
                </div>
              </div>
              <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (summary.wind_energy_wh_today / summary.load_energy_wh_today) * 100)}%` }}
                />
              </div>
            </div>

            {/* Battery Energy Used */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-purple-400">
                      <rect x="5" y="7" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                      <path d="M19 10h2v4h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <rect x="8" y="10" width="3" height="4" fill="currentColor" rx="0.5"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Stored Energy Used</p>
                    <p className="text-2xl font-light text-white">{(summary.battery_discharge_energy_wh_today / 1000).toFixed(2)} <span className="text-sm text-slate-400">kWh</span></p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Battery SOC</p>
                  <p className="text-lg text-purple-400">{summary.current_battery_soc_pct.toFixed(1)}%</p>
                </div>
              </div>
              <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all"
                  style={{ width: `${summary.current_battery_soc_pct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Energy Distribution Pie Chart */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700">
          <div className="flex items-center space-x-3 mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-blue-500">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M12 2v10l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <h3 className="text-xl font-light text-white">Energy Sources Distribution</h3>
          </div>
          {energyDistribution.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={energyDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {energyDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value.toFixed(2)} kWh`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-6 space-y-3">
                {energyDistribution.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-300 text-sm">{item.name}</span>
                    </div>
                    <span className="text-slate-400 text-sm font-medium">{item.value.toFixed(2)} kWh</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-slate-400 text-center py-8">No energy data available yet</p>
          )}
        </div>
      </div>

      {/* Environmental Impact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-900/20 to-green-800/10 rounded-2xl p-6 border border-green-800/30">
          <div className="flex items-center justify-between mb-4">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="text-green-400">
              <path d="M12 2C8 2 5 5 5 9c0 5 5 10 7 12 2-2 7-7 7-12 0-4-3-7-7-7z" fill="currentColor" opacity="0.2"/>
              <path d="M12 2C8 2 5 5 5 9c0 5 5 10 7 12 2-2 7-7 7-12 0-4-3-7-7-7z" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M12 7v6m-2-3l2 2 2-2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">Environment</span>
          </div>
          <p className="text-sm text-slate-400 mb-2">CO2 Saved</p>
          <p className="text-3xl font-light text-white mb-1">{summary.co2_saved_kg_today.toFixed(2)}</p>
          <p className="text-xs text-slate-500">kg of carbon emissions avoided</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 rounded-2xl p-6 border border-emerald-800/30">
          <div className="flex items-center justify-between mb-4">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="text-emerald-400">
              <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2"/>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M12 6v12M9 9h4.5a2 2 0 0 1 0 4H9" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium">Savings</span>
          </div>
          <p className="text-sm text-slate-400 mb-2">Money Saved</p>
          <p className="text-3xl font-light text-white mb-1">${summary.money_saved_cad_today.toFixed(2)}</p>
          <p className="text-xs text-slate-500">CAD saved on electricity</p>
        </div>

        <div className="bg-gradient-to-br from-orange-900/20 to-orange-800/10 rounded-2xl p-6 border border-orange-800/30">
          <div className="flex items-center justify-between mb-4">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="text-orange-400">
              <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" fill="currentColor" opacity="0.2"/>
              <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
            <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs font-medium">Consumption</span>
          </div>
          <p className="text-sm text-slate-400 mb-2">Total Load</p>
          <p className="text-3xl font-light text-white mb-1">{(summary.load_energy_wh_today / 1000).toFixed(2)}</p>
          <p className="text-xs text-slate-500">kWh consumed today</p>
        </div>
      </div>

      {/* Energy Collection Over Time */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-light text-white">Energy Collection Over Time</h3>
            <p className="text-sm text-slate-500 mt-1">Solar and wind generation tracking</p>
          </div>
          <div className="flex space-x-2">
            {(['1h', '6h', '24h'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-1.5 rounded-full text-sm transition-all ${
                  timeRange === range
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorSolar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#eab308" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorWind" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis 
              dataKey="time" 
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickLine={false}
            />
            <YAxis 
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickLine={false}
              label={{ value: 'Power (W)', angle: -90, position: 'insideLeft', fill: '#64748b' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #475569',
                borderRadius: '12px',
                padding: '12px'
              }}
            />
            <Area type="monotone" dataKey="solar" stroke="#eab308" fillOpacity={1} fill="url(#colorSolar)" strokeWidth={2} name="Solar" />
            <Area type="monotone" dataKey="wind" stroke="#3b82f6" fillOpacity={1} fill="url(#colorWind)" strokeWidth={2} name="Wind" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Power Flow and Battery Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Power Flow Chart */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700">
          <h3 className="text-xl font-light text-white mb-6">System Power Flow</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis 
                dataKey="time" 
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={false}
              />
              <YAxis 
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #475569',
                  borderRadius: '12px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="solar" stroke="#eab308" name="Solar" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="wind" stroke="#3b82f6" name="Wind" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="load" stroke="#f97316" name="Load" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Battery Status Chart */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700">
          <h3 className="text-xl font-light text-white mb-6">Battery Performance</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis 
                dataKey="time" 
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={false}
              />
              <YAxis 
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={false}
                domain={[0, 100]}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #475569',
                  borderRadius: '12px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="batterySOC" stroke="#10b981" name="Battery SOC (%)" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 pt-4 border-t border-slate-700 text-center">
            <p className="text-xs text-slate-500">Current Charge Power</p>
            <p className={`text-lg font-light mt-1 ${summary.current_battery_energy_wh > 5000 ? 'text-green-400' : 'text-orange-400'}`}>
              {(summary.current_battery_energy_wh / 1000).toFixed(2)} kWh
            </p>
          </div>
        </div>
      </div>

      {/* Forecast Section */}
      {forecast && (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-light text-white">Forecast & Projections</h3>
              <p className="text-sm text-slate-500 mt-1">
                Based on {forecast.based_on_last_n_days} days average
              </p>
            </div>
            <div className="flex space-x-2">
              {([7, 14, 30] as const).map((days) => (
                <button
                  key={days}
                  onClick={() => setForecastDays(days)}
                  className={`px-4 py-1.5 rounded-full text-sm transition-all ${
                    forecastDays === days
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>
          </div>

          {/* Forecast Chart */}
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={forecast.forecasts.slice(0, 7)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={false}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis 
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #475569',
                  borderRadius: '12px'
                }}
                formatter={(value: number) => `$${value.toFixed(2)}`}
              />
              <Bar dataKey="predicted_money_saved_cad" fill="#10b981" radius={[8, 8, 0, 0]} name="Projected Savings" />
            </BarChart>
          </ResponsiveContainer>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-700">
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-2">Total Projected</p>
              <p className="text-2xl font-light text-green-400">
                ${forecast.forecasts.reduce((sum, day) => sum + day.predicted_money_saved_cad, 0).toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-2">Avg. Per Day</p>
              <p className="text-2xl font-light text-white">
                ${(forecast.forecasts.reduce((sum, day) => sum + day.predicted_money_saved_cad, 0) / forecast.forecasts.length).toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-2">Energy Projected</p>
              <p className="text-2xl font-light text-blue-400">
                {forecast.forecasts.reduce((sum, day) => sum + day.predicted_renewable_energy_kwh, 0).toFixed(1)} kWh
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
