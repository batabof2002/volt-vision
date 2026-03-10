import { useState, useEffect } from 'react';
import { apiService } from '../services/api';

export default function SimulationControl() {
  const [status, setStatus] = useState<'running' | 'paused'>('paused');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 5000); // Check status every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      const data = await apiService.getSimulationStatus();
      setStatus(data.status);
    } catch (error) {
      console.error('Failed to load simulation status:', error);
    }
  };

  const handlePause = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await apiService.pauseSimulation();
      setStatus('paused');
      setMessage(response.message);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to pause simulation');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await apiService.startSimulation();
      setStatus('running');
      setMessage(response.message);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to start simulation');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-white mb-1">Simulation Control</h3>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${status === 'running' ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-slate-400">
              Status: <span className={status === 'running' ? 'text-green-400' : 'text-red-400'}>
                {status === 'running' ? 'Running' : 'Paused'}
              </span>
            </span>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handleStart}
            disabled={loading || status === 'running'}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              status === 'running' || loading
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {loading && status === 'paused' ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Starting...
              </span>
            ) : (
              '▶ Start'
            )}
          </button>
          
          <button
            onClick={handlePause}
            disabled={loading || status === 'paused'}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              status === 'paused' || loading
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {loading && status === 'running' ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Pausing...
              </span>
            ) : (
              '⏸ Pause'
            )}
          </button>
        </div>
      </div>
      
      {message && (
        <div className="mt-4 p-3 bg-slate-700/50 rounded-lg border border-slate-600">
          <p className="text-sm text-slate-300">{message}</p>
        </div>
      )}
      
      <div className="mt-4 pt-4 border-t border-slate-700">
        <p className="text-xs text-slate-500">
          💡 Tip: Pause the simulation when using manual data entry or receiving data from your halogen lamp and wind turbine. 
          The simulation generates random values for testing purposes.
        </p>
      </div>
    </div>
  );
}
