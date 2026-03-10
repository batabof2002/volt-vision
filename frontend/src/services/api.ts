/**
 * API service for communicating with the backend
 */
import axios from 'axios';
import type {
  TelemetryReading,
  TelemetryReadingCreate,
  DailySummary,
  Forecast,
  SystemSettings,
  SettingsUpdate,
} from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
  // Telemetry endpoints
  async getTelemetryReadings(params?: {
    from_time?: string;
    to_time?: string;
    interval_minutes?: number;
    limit?: number;
  }): Promise<TelemetryReading[]> {
    const response = await api.get('/telemetry', { params });
    return response.data;
  },

  async createTelemetryReading(data: TelemetryReadingCreate): Promise<TelemetryReading> {
    const response = await api.post('/telemetry', data);
    return response.data;
  },

  async deleteAllTelemetry(): Promise<void> {
    await api.delete('/telemetry/all');
  },

  // Summary endpoints
  async getTodaySummary(): Promise<DailySummary> {
    const response = await api.get('/summary/today');
    return response.data;
  },

  async getRangeSummary(from_date: string, to_date: string): Promise<any> {
    const response = await api.get('/summary/range', {
      params: { from_date, to_date },
    });
    return response.data;
  },

  // Forecast endpoints
  async getForecast(days: number = 7, based_on_last_n_days: number = 7): Promise<Forecast> {
    const response = await api.get('/forecast', {
      params: { days, based_on_last_n_days },
    });
    return response.data;
  },

  // Settings endpoints
  async getSettings(): Promise<SystemSettings> {
    const response = await api.get('/settings');
    return response.data;
  },

  async updateSettings(data: SettingsUpdate): Promise<SystemSettings> {
    const response = await api.put('/settings', data);
    return response.data;
  },

  // Simulation control endpoints
  async pauseSimulation(): Promise<{ status: string; message: string }> {
    const response = await api.post('/simulation/pause');
    return response.data;
  },

  async startSimulation(): Promise<{ status: string; message: string }> {
    const response = await api.post('/simulation/start');
    return response.data;
  },

  async getSimulationStatus(): Promise<{ 
    status: 'running' | 'paused'; 
    enabled: boolean; 
    interval_seconds: number 
  }> {
    const response = await api.get('/simulation/status');
    return response.data;
  },
};
