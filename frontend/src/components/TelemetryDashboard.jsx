import React from 'react';
import { Activity, Clock, CheckCircle, AlertTriangle, RefreshCw, Zap, Server, ShieldCheck } from 'lucide-react';
import { useTelemetry } from '../hooks/useTelemetry';

export function TelemetryDashboard() {
  const { stats, logs, loading, error, refreshTelemetry } = useTelemetry(true, 3000);

  const getStatusBadge = (statusCode) => {
    if (statusCode < 300) {
      return <span className="badge badge-emerald">{statusCode} OK</span>;
    } else if (statusCode < 400) {
      return <span className="badge badge-cyan">{statusCode} REDIRECT</span>;
    } else if (statusCode < 500) {
      return <span className="badge badge-amber">{statusCode} CLIENT ERR</span>;
    } else {
      return <span className="badge badge-rose">{statusCode} SERVER ERR</span>;
    }
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '36px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span className="badge badge-cyan" style={{ marginBottom: '8px' }}>
            <Activity size={13} className="pulse" /> Real-Time Middleware Stream
          </span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
            API Response & Latency Telemetry Monitor
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Live ASGI telemetry tracking request duration (ms), response codes, client IP, and endpoint load.
          </p>
        </div>

        <button className="btn-secondary" onClick={refreshTelemetry}>
          <RefreshCw size={15} /> Refresh Stream
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '18px', marginBottom: '32px' }}>
        
        <div style={{ background: 'rgba(6, 8, 16, 0.6)', padding: '22px', borderRadius: '18px', border: '1px solid var(--border-glass)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '8px' }}>
            <Clock size={16} color="var(--primary)" /> Avg Latency
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>
            {stats.avg_response_time_ms} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>ms</span>
          </div>
        </div>

        <div style={{ background: 'rgba(6, 8, 16, 0.6)', padding: '22px', borderRadius: '18px', border: '1px solid var(--border-glass)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '8px' }}>
            <Server size={16} color="var(--accent-cyan)" /> Total API Requests
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>
            {stats.total_requests}
          </div>
        </div>

        <div style={{ background: 'rgba(6, 8, 16, 0.6)', padding: '22px', borderRadius: '18px', border: '1px solid var(--border-glass)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '8px' }}>
            <ShieldCheck size={16} color="var(--accent-emerald)" /> Successful (2xx)
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
            {stats.success_count}
          </div>
        </div>

        <div style={{ background: 'rgba(6, 8, 16, 0.6)', padding: '22px', borderRadius: '18px', border: '1px solid var(--border-glass)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '8px' }}>
            <AlertTriangle size={16} color="var(--accent-rose)" /> Errors (4xx/5xx)
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: stats.error_count > 0 ? 'var(--accent-rose)' : 'var(--text-muted)' }}>
            {stats.error_count}
          </div>
        </div>

        <div style={{ background: 'rgba(6, 8, 16, 0.6)', padding: '22px', borderRadius: '18px', border: '1px solid var(--border-glass)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '8px' }}>
            <Zap size={16} color="var(--accent-amber)" /> Latency Range
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
            {stats.min_response_time_ms} ms / {stats.max_response_time_ms} ms
          </div>
        </div>

      </div>

      {/* Logs Table */}
      <div>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={18} color="var(--primary)" /> API Telemetry Audit Stream (Last 40 Requests)
        </h3>

        {loading && logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading API telemetry stream...</div>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: '14px', border: '1px solid var(--border-glass)', background: 'rgba(6, 8, 16, 0.4)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.05)', borderBottom: '1px solid var(--border-glass)' }}>
                  <th style={{ padding: '12px 16px', color: '#fff', fontWeight: 600 }}>Timestamp</th>
                  <th style={{ padding: '12px 16px', color: '#fff', fontWeight: 600 }}>Method</th>
                  <th style={{ padding: '12px 16px', color: '#fff', fontWeight: 600 }}>Endpoint</th>
                  <th style={{ padding: '12px 16px', color: '#fff', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '12px 16px', color: '#fff', fontWeight: 600 }}>Response Time</th>
                  <th style={{ padding: '12px 16px', color: '#fff', fontWeight: 600 }}>Client IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                    <td style={{ padding: '12px 16px', color: 'var(--text-dim)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                      <span style={{ color: log.method === 'POST' ? 'var(--accent-cyan)' : 'var(--primary)' }}>
                        {log.method}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                      {log.endpoint}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {getStatusBadge(log.status_code)}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: log.response_time_ms > 200 ? 'var(--accent-amber)' : 'var(--accent-emerald)' }}>
                      {log.response_time_ms} ms
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-dim)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                      {log.client_ip || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
