import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/api';

export function useTelemetry(autoRefresh = true, intervalMs = 3000) {
  const [stats, setStats] = useState({
    total_requests: 0,
    avg_response_time_ms: 0,
    min_response_time_ms: 0,
    max_response_time_ms: 0,
    success_count: 0,
    error_count: 0
  });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTelemetry = useCallback(async () => {
    try {
      const [statsRes, logsRes] = await Promise.all([
        apiClient.get('/api/telemetry/stats'),
        apiClient.get('/api/telemetry/logs?limit=40')
      ]);
      setStats(statsRes.data);
      setLogs(logsRes.data);
      setError(null);
    } catch (err) {
      setError('Telemetry service offline');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTelemetry();
    if (!autoRefresh) return;
    const timer = setInterval(fetchTelemetry, intervalMs);
    return () => clearInterval(timer);
  }, [fetchTelemetry, autoRefresh, intervalMs]);

  return {
    stats,
    logs,
    loading,
    error,
    refreshTelemetry: fetchTelemetry
  };
}
