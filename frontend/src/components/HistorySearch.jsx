import React, { useState, useEffect, useCallback } from 'react';
import { Search, Download, FileText, User, Calendar, Database, RefreshCw } from 'lucide-react';
import { apiClient } from '../services/api';

export function HistorySearch({ onDownload }) {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async (searchQuery = '') => {
    setLoading(true);
    try {
      const url = searchQuery ? `/api/history?q=${encodeURIComponent(searchQuery)}` : '/api/history';
      const res = await apiClient.get(url);
      setHistory(res.data);
    } catch (err) {
      console.error('Failed to fetch history', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory('');
  }, [fetchHistory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchHistory(query);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '32px' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
            Search Datasets & Conversion History
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Search inside <strong style={{ color: 'var(--accent-emerald)' }}>pickle data cell contents & rows</strong>, usernames, converted filenames, schemas, or file formats.
          </p>
        </div>

        <button className="btn-secondary" onClick={() => fetchHistory(query)}>
          <RefreshCw size={15} /> Refresh History
        </button>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} style={{ marginBottom: '24px' }}>
        <div style={{ position: 'relative' }}>
          <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
          <input
            type="text"
            className="input-field"
            placeholder="Search inside pickle data values (e.g. airport code, row value), @username, filename, or schema..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ paddingLeft: '44px', paddingRight: '120px', height: '48px', fontSize: '0.95rem' }}
          />
          <button
            type="submit"
            className="btn-primary"
            style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', padding: '8px 18px' }}
          >
            Search
          </button>
        </div>
      </form>

      {/* History Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Loading conversion history & searching pickle dataset contents...
        </div>
      ) : history.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
          No conversion records or pickle data rows found matching your search.
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.05)', borderBottom: '1px solid var(--border-glass)' }}>
                <th style={{ padding: '12px 16px', color: '#fff', fontWeight: 600 }}>File Name</th>
                <th style={{ padding: '12px 16px', color: '#fff', fontWeight: 600 }}>User Session</th>
                <th style={{ padding: '12px 16px', color: '#fff', fontWeight: 600 }}>Conversion</th>
                <th style={{ padding: '12px 16px', color: '#fff', fontWeight: 600 }}>Rows × Cols</th>
                <th style={{ padding: '12px 16px', color: '#fff', fontWeight: 600 }}>Output Size</th>
                <th style={{ padding: '12px 16px', color: '#fff', fontWeight: 600 }}>Date</th>
                <th style={{ padding: '12px 16px', color: '#fff', fontWeight: 600, textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => {
                const targetFmt = (item.target_format || 'pkl').toLowerCase();
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)', transition: 'background 0.2s' }}>
                    
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#fff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={16} color="var(--primary)" />
                        {item.original_filename}
                      </div>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <span className="badge badge-cyan">
                        <User size={12} /> @{item.username}
                      </span>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <span className={`badge ${item.file_type === 'csv' ? 'badge-amber' : 'badge-cyan'}`}>
                        .{item.file_type.toUpperCase()} → .{targetFmt.toUpperCase()}
                      </span>
                    </td>

                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                      {item.row_count} rows × {item.column_count} cols
                    </td>

                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                      {formatSize(item.pickle_size_bytes)}
                    </td>

                    <td style={{ padding: '12px 16px', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                      {new Date(item.created_at).toLocaleString()}
                    </td>

                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        className="btn-secondary"
                        onClick={() => onDownload(item.file_id, item.original_filename, targetFmt)}
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      >
                        <Download size={14} /> .{targetFmt}
                      </button>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
