import { useState } from 'react';
import { apiService } from '../services/api';
import type { TelemetryReadingCreate } from '../types/api';

export default function DataInput() {
  const [formData, setFormData] = useState<TelemetryReadingCreate>({
    solar_power_w: 0,
    wind_power_w: 0,
    load_power_w: 0,
    battery_soc_pct: 50,
    battery_energy_wh: 5000,
    battery_charge_power_w: 0,
    grid_import_power_w: 0,
    grid_export_power_w: 0,
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field: keyof TelemetryReadingCreate, value: string) => {
    setFormData({
      ...formData,
      [field]: parseFloat(value) || 0,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      await apiService.createTelemetryReading(formData);
      setMessage({ type: 'success', text: 'Telemetry data saved successfully!' });
      
      // Reset form after 2 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save data. Check your connection.' });
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to delete ALL telemetry data? This cannot be undone.')) {
      return;
    }

    try {
      await apiService.deleteAllTelemetry();
      setMessage({ type: 'success', text: 'All telemetry data deleted.' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete data.' });
      console.error(error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white">Data Input</h2>
        <p className="text-slate-400 mt-1">Manually enter telemetry readings or manage simulation</p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-400 mb-2">ℹ️ Data Input Methods</h3>
        <ul className="text-slate-300 space-y-1 text-sm">
          <li>• <strong>Simulation:</strong> Backend automatically generates realistic data every 60 seconds</li>
          <li>• <strong>Manual Entry:</strong> Use the form below to add custom readings</li>
          <li>• <strong>Hardware Integration:</strong> Future integration point for real sensors (API endpoints ready)</li>
        </ul>
      </div>

      {/* Status Messages */}
      {message && (
        <div
          className={`rounded-lg p-4 ${
            message.type === 'success'
              ? 'bg-green-900/20 border border-green-500 text-green-400'
              : 'bg-red-900/20 border border-red-500 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Manual Entry Form */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-xl font-semibold text-white mb-6">Manual Telemetry Entry</h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Power Generation */}
          <div>
            <h4 className="text-lg font-medium text-slate-300 mb-4">Power Generation</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  ☀️ Solar Power (W)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.solar_power_w}
                  onChange={(e) => handleChange('solar_power_w', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                  placeholder="e.g., 3500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  💨 Wind Power (W)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.wind_power_w}
                  onChange={(e) => handleChange('wind_power_w', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                  placeholder="e.g., 1200"
                />
              </div>
            </div>
          </div>

          {/* Load */}
          <div>
            <h4 className="text-lg font-medium text-slate-300 mb-4">Load</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  ⚡ Load Power (W)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.load_power_w}
                  onChange={(e) => handleChange('load_power_w', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                  placeholder="e.g., 2000"
                />
              </div>
            </div>
          </div>

          {/* Battery */}
          <div>
            <h4 className="text-lg font-medium text-slate-300 mb-4">Battery State</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  🔋 State of Charge (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.battery_soc_pct}
                  onChange={(e) => handleChange('battery_soc_pct', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                  placeholder="0-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Battery Energy (Wh)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.battery_energy_wh}
                  onChange={(e) => handleChange('battery_energy_wh', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                  placeholder="e.g., 7500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Charge Power (W)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.battery_charge_power_w}
                  onChange={(e) => handleChange('battery_charge_power_w', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                  placeholder="+ charging / - discharging"
                />
                <p className="text-xs text-slate-500 mt-1">Positive = charging, Negative = discharging</p>
              </div>
            </div>
          </div>

          {/* Grid (Optional) */}
          <div>
            <h4 className="text-lg font-medium text-slate-300 mb-4">Grid Interaction (Optional)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Grid Import (W)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.grid_import_power_w}
                  onChange={(e) => handleChange('grid_import_power_w', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Grid Export (W)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.grid_export_power_w}
                  onChange={(e) => handleChange('grid_export_power_w', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
            >
              {submitting ? 'Saving...' : '💾 Save Reading'}
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-red-400 mb-4">⚠️ Danger Zone</h3>
        <p className="text-slate-300 mb-4">
          Delete all telemetry data from the database. This is useful for testing or resetting the system.
          This action cannot be undone.
        </p>
        <button
          onClick={handleReset}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
        >
          🗑️ Delete All Data
        </button>
      </div>

      {/* API Examples */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-xl font-semibold text-white mb-4">📡 API Integration Example</h3>
        <p className="text-slate-300 mb-4">
          For hardware integration, POST data to the API endpoint:
        </p>
        <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm text-slate-300 overflow-x-auto">
          <pre>{`curl -X POST http://localhost:8000/api/telemetry \\
  -H "Content-Type: application/json" \\
  -d '{
    "solar_power_w": 3500,
    "wind_power_w": 1200,
    "load_power_w": 2000,
    "battery_soc_pct": 75,
    "battery_energy_wh": 7500,
    "battery_charge_power_w": 700
  }'`}</pre>
        </div>
      </div>
    </div>
  );
}
