import React, { useState } from 'react';
import { Download, Table, Layers, HardDrive, Clock, CheckCircle2, ChevronLeft, ChevronRight, AlertTriangle, Sparkles, ArrowRight, Search, Code } from 'lucide-react';

export function DataPreview({ result, latency, onDownload }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'code'

  if (!result) return null;

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const compressionRatio = ((1 - result.pickle_size_bytes / result.original_size_bytes) * 100).toFixed(1);

  const previewRows = result.preview_rows || [];
  
  const filteredRows = previewRows.filter((row) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return Object.values(row).some((val) =>
      val !== null && val !== undefined && String(val).toLowerCase().includes(q)
    );
  });

  const totalPreviewRows = filteredRows.length;
  const totalPages = Math.ceil(totalPreviewRows / pageSize) || 1;

  const startIndex = (currentPage - 1) * pageSize;
  const currentRows = filteredRows.slice(startIndex, startIndex + pageSize);

  const targetFmt = (result.target_format || 'pkl').toLowerCase();
  const baseDownloadName = result.original_filename.split('.')[0];
  const convertedDownloadName = `${baseDownloadName}.${targetFmt}`;

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '32px', marginBottom: '32px' }}>
      
      {/* Header Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-emerald">
              <CheckCircle2 size={13} /> Converted to .{targetFmt.toUpperCase()}
            </span>
            {result.duplicate_count > 0 && result.remove_duplicates_applied && (
              <span className="badge badge-cyan">
                <Sparkles size={12} /> Unique Cleaned
              </span>
            )}
          </div>
          
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{result.original_filename}</span>
            <ArrowRight size={18} color="var(--primary)" />
            <span style={{ color: 'var(--accent-emerald)' }}>{convertedDownloadName}</span>
          </h2>
          
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            User Session: <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>@{result.username}</span> | File ID: <span style={{ fontFamily: 'var(--font-mono)' }}>{result.file_id}</span>
          </div>
        </div>

        <button
          className="btn-primary"
          onClick={() => onDownload(result.file_id, result.original_filename, targetFmt)}
          style={{ background: 'linear-gradient(135deg, #10b981, #059669)', padding: '12px 24px', fontSize: '0.95rem' }}
        >
          <Download size={18} /> Download {convertedDownloadName} ({result.row_count.toLocaleString()} Rows)
        </button>
      </div>

      {/* Clean Notification Bar for Duplicates / Dataset Size */}
      {result.duplicate_count > 0 ? (
        <div style={{
          background: result.remove_duplicates_applied ? 'rgba(16, 185, 129, 0.10)' : 'rgba(245, 158, 11, 0.10)',
          border: result.remove_duplicates_applied ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
          padding: '12px 18px',
          borderRadius: '12px',
          color: '#f3f4f6',
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px'
        }}>
          {result.remove_duplicates_applied ? (
            <>
              <Sparkles size={20} color="var(--accent-emerald)" style={{ flexShrink: 0 }} />
              <div>
                <strong>Deduplicated & Cleaned:</strong> Removed {result.duplicate_count} duplicate records matching key fields ({result.dedup_key_column || 'User ID, Email, Phone'}). Initial: {result.initial_row_count} → Final: <strong>{result.row_count.toLocaleString()} unique rows</strong>.
              </div>
            </>
          ) : (
            <>
              <AlertTriangle size={20} color="var(--accent-amber)" style={{ flexShrink: 0 }} />
              <div>
                <strong>Duplicate Entries Preserved:</strong> File contains {result.duplicate_count} duplicate records. <em>Tip: Enable 'Remove Duplicate Rows' to automatically filter duplicates.</em>
              </div>
            </>
          )}
        </div>
      ) : null}

      {/* Metrics Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        
        <div style={{ background: 'rgba(10, 15, 26, 0.6)', padding: '16px 20px', borderRadius: '14px', border: '1px solid var(--border-glass)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '6px' }}>
            <Layers size={15} color="var(--primary)" /> Dimensions
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
            {result.row_count.toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>rows</span> × {result.column_count} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>cols</span>
          </div>
        </div>

        <div style={{ background: 'rgba(10, 15, 26, 0.6)', padding: '16px 20px', borderRadius: '14px', border: '1px solid var(--border-glass)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '6px' }}>
            <HardDrive size={15} color="var(--accent-cyan)" /> Output Size
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
            {formatSize(result.pickle_size_bytes)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Original: {formatSize(result.original_size_bytes)}
          </div>
        </div>

        <div style={{ background: 'rgba(10, 15, 26, 0.6)', padding: '16px 20px', borderRadius: '14px', border: '1px solid var(--border-glass)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '6px' }}>
            <Clock size={15} color="var(--accent-amber)" /> Processing Time
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
            {latency ? `${latency.backendMs} ms` : 'Fast'}
          </div>
        </div>

      </div>

      {/* Dataset Columns Tags */}
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Schema Columns ({result.columns.length})
        </h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {result.columns.map((col, idx) => (
            <span key={idx} style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-glass)',
              borderRadius: '6px',
              padding: '3px 9px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              color: 'var(--text-main)'
            }}>
              {col}
            </span>
          ))}
        </div>
      </div>

      {/* Data Preview Controls Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          
          {/* View Mode Toggle Buttons */}
          <div style={{ display: 'flex', gap: '6px', background: 'rgba(6, 8, 16, 0.7)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                background: viewMode === 'table' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'table' ? '#fff' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              <Table size={14} /> Interactive Table
            </button>
            <button
              type="button"
              onClick={() => setViewMode('code')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                background: viewMode === 'code' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'code' ? '#fff' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              <Code size={14} /> Converted .{targetFmt.toUpperCase()} Code Snippet
            </button>
          </div>

          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Target Format: <strong style={{ color: 'var(--accent-emerald)', textTransform: 'uppercase' }}>.{targetFmt}</strong>
          </span>

        </div>

        {viewMode === 'code' ? (
          /* Raw Output File Snippet View */
          <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-glass)', background: '#0a0f1a' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '10px 16px', borderBottom: '1px solid var(--border-glass)', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Raw Converted .{targetFmt.toUpperCase()} File Preview</span>
              <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>.{targetFmt} Output</span>
            </div>
            <pre style={{
              padding: '18px',
              margin: 0,
              maxHeight: '400px',
              overflowY: 'auto',
              fontSize: '0.84rem',
              fontFamily: 'var(--font-mono)',
              color: targetFmt === 'json' ? 'var(--accent-cyan)' : targetFmt === 'csv' ? 'var(--accent-amber)' : 'var(--accent-emerald)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              lineHeight: 1.5
            }}>
              {result.raw_output_snippet || 'No output snippet preview available.'}
            </pre>
          </div>
        ) : (
          /* Interactive Grid Table View */
          <>
            {/* In-Table Search Bar */}
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
              <input
                type="text"
                className="input-field"
                placeholder="Search row values inside generated file preview..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                style={{ paddingLeft: '44px', paddingRight: '16px', height: '44px', fontSize: '0.92rem', borderRadius: '12px' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Table size={15} /> Dataset Table Preview ({totalPreviewRows} {searchQuery ? 'matching' : ''} rows)
              </h4>

              {/* Page Size & Pagination */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>Rows per page:</span>
                  <select
                    className="input-field"
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                    style={{ width: 'auto', padding: '4px 8px', fontSize: '0.8rem' }}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    className="btn-secondary"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    style={{ padding: '4px 8px' }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0 6px' }}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    className="btn-secondary"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    style={{ padding: '4px 8px' }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Clean Table */}
            <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-glass)', background: 'rgba(10, 15, 26, 0.4)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.05)', borderBottom: '1px solid var(--border-glass)' }}>
                    <th style={{ padding: '12px 14px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', width: '50px' }}>#</th>
                    {result.columns.map((col, i) => (
                      <th key={i} style={{ padding: '12px 14px', color: '#fff', fontWeight: 600 }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentRows.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)' }}>
                      <td style={{ padding: '10px 14px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{startIndex + idx + 1}</td>
                      {result.columns.map((col, cIdx) => (
                        <td key={cIdx} style={{ padding: '10px 14px', color: 'var(--text-main)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {row[col] !== undefined && row[col] !== null ? String(row[col]) : <em style={{ color: 'var(--text-dim)' }}>null</em>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

    </div>
  );
}
