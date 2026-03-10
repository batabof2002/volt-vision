import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import type { SystemSettings, SettingsUpdate } from '../types/api';

export default function Settings() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [formData, setFormData] = useState<SettingsUpdate>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await apiService.getSettings();
      setSettings(data);
      setFormData({
        electricity_rate_cad_per_kwh: data.electricity_rate_cad_per_kwh,
        co2_intensity_kg_per_kwh: data.co2_intensity_kg_per_kwh,
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const updated = await apiService.updateSettings(formData);
      setSettings(updated);
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-slate-400">Loading settings...</div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white">Settings</h2>
        <p className="text-slate-400 mt-1">Configure system parameters and calculation constants</p>
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

      {/* System Configuration */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-xl font-semibold text-white mb-6">⚙️ System Configuration</h3>
        
        <div className="space-y-6">
          {/* Read-only System Specs */}
          <div>
            <h4 className="text-lg font-medium text-slate-300 mb-4">Hardware Specifications</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 rounded-lg p-4">
                <p className="text-sm text-slate-400">Battery Capacity</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {(settings.battery_capacity_wh / 1000).toFixed(1)} kWh
                </p>
              </div>
              <div className="bg-slate-900 rounded-lg p-4">
                <p className="text-sm text-slate-400">Solar Peak Power</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {(settings.solar_peak_power_w / 1000).toFixed(1)} kW
                </p>
              </div>
              <div className="bg-slate-900 rounded-lg p-4">
                <p className="text-sm text-slate-400">Wind Peak Power</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {(settings.wind_peak_power_w / 1000).toFixed(1)} kW
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-400 mt-3">
              These values are configured in the backend .env file
            </p>
          </div>

          {/* Editable Calculation Parameters */}
          <div>
            <h4 className="text-lg font-medium text-slate-300 mb-4">Calculation Parameters</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  💰 Electricity Rate (CAD per kWh)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.electricity_rate_cad_per_kwh}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      electricity_rate_cad_per_kwh: parseFloat(e.target.value),
                    })
                  }
                  className="w-full md:w-1/2 px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                />
                <p className="text-sm text-slate-400 mt-1">
                  Used to calculate money saved. Average Ontario rate: $0.18/kWh
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  🌱 CO₂ Intensity (kg per kWh)
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={formData.co2_intensity_kg_per_kwh}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      co2_intensity_kg_per_kwh: parseFloat(e.target.value),
                    })
                  }
                  className="w-full md:w-1/2 px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                />
                <p className="text-sm text-slate-400 mt-1">
                  Grid CO₂ emissions intensity. Ontario: ~0.03 kg/kWh (mostly nuclear/hydro)
                </p>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="mt-6 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
            >
              {saving ? 'Saving...' : '💾 Save Settings'}
            </button>
          </div>
        </div>
      </div>

      {/* Regional Examples */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-xl font-semibold text-white mb-4">📍 Regional Reference Values</h3>
        <p className="text-slate-300 mb-4">
          Example electricity rates and CO₂ intensities for different regions:
        </p>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="pb-3 text-slate-300 font-semibold">Region</th>
                <th className="pb-3 text-slate-300 font-semibold">Electricity Rate (CAD/kWh)</th>
                <th className="pb-3 text-slate-300 font-semibold">CO₂ Intensity (kg/kWh)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-700/50">
                <td className="py-3 text-slate-200">Ontario</td>
                <td className="py-3 text-slate-200">$0.18</td>
                <td className="py-3 text-slate-200">0.030</td>
              </tr>
              <tr className="border-b border-slate-700/50">
                <td className="py-3 text-slate-200">Alberta</td>
                <td className="py-3 text-slate-200">$0.16</td>
                <td className="py-3 text-slate-200">0.640</td>
              </tr>
              <tr className="border-b border-slate-700/50">
                <td className="py-3 text-slate-200">British Columbia</td>
                <td className="py-3 text-slate-200">$0.14</td>
                <td className="py-3 text-slate-200">0.010</td>
              </tr>
              <tr className="border-b border-slate-700/50">
                <td className="py-3 text-slate-200">California, USA</td>
                <td className="py-3 text-slate-200">$0.30 USD</td>
                <td className="py-3 text-slate-200">0.200</td>
              </tr>
              <tr className="border-b border-slate-700/50">
                <td className="py-3 text-slate-200">Germany</td>
                <td className="py-3 text-slate-200">$0.40 USD</td>
                <td className="py-3 text-slate-200">0.350</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-sm text-slate-400 mt-4">
          Note: CO₂ intensity varies significantly by region based on energy mix (coal, gas, nuclear, renewables).
          Ontario's low value is due to significant nuclear and hydro power.
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-400 mb-2">ℹ️ About These Settings</h3>
        <ul className="text-slate-300 space-y-1 text-sm">
          <li>• Settings changes apply immediately to calculations</li>
          <li>• Historical data is not recalculated when settings change</li>
          <li>• For persistent changes, update the backend .env file</li>
          <li>• Hardware specs (battery/solar/wind capacity) are configured in backend only</li>
        </ul>
      </div>
    </div>
  );
}
