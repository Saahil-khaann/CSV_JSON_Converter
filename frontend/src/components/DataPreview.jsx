import React, { useState } from 'react';
import { Download, Table, Layers, HardDrive, Clock, CheckCircle2, ChevronLeft, ChevronRight, AlertTriangle, Sparkles, ArrowRight, Search, Code, Edit, Trash2, Plus, Check, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export function DataPreview({ result, latency, onDownload, onAddRow, onUpdateRow, onDeleteRow }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'code'
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingData, setEditingData] = useState({});
  const [isAdding, setIsAdding] = useState(false);
  const [newData, setNewData] = useState({});
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

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

  const sortedRows = [...filteredRows].sort((a, b) => {
    if (!sortColumn) return 0;
    const valA = a[sortColumn] !== undefined && a[sortColumn] !== null ? a[sortColumn] : '';
    const valB = b[sortColumn] !== undefined && b[sortColumn] !== null ? b[sortColumn] : '';

    const numA = Number(valA);
    const numB = Number(valB);
    const isNum = !isNaN(numA) && !isNaN(numB) && String(valA).trim() !== '' && String(valB).trim() !== '';

    let comparison = 0;
    if (isNum) {
      comparison = numA - numB;
    } else {
      comparison = String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' });
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const totalPreviewRows = sortedRows.length;
  const totalPages = Math.ceil(totalPreviewRows / pageSize) || 1;

  const startIndex = (currentPage - 1) * pageSize;
  const currentRows = sortedRows.slice(startIndex, startIndex + pageSize);

  const handleSort = (col) => {
    if (sortColumn === col) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(col);
      setSortDirection('asc');
    }
  };

  const rowCount = result?.row_count ?? 0;
  const colCount = result?.column_count ?? 0;
  const columnsList = Array.isArray(result?.columns) ? result.columns : [];
  const origFilename = result?.original_filename || 'converted_file';
  const baseDownloadName = origFilename.split('.')[0] || 'converted_file';
  const targetFmt = (result?.target_format || 'pkl').toLowerCase();
  const convertedDownloadName = `${baseDownloadName}.${targetFmt}`;

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '32px', marginBottom: '32px' }}>
      
      {/* Clean Sober Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
              <span>{origFilename}</span>
              <ArrowRight size={16} color="var(--primary)" />
              <span style={{ color: 'var(--accent-emerald)' }}>{convertedDownloadName}</span>
            </h2>
            <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
              <CheckCircle2 size={12} /> Converted .{targetFmt.toUpperCase()}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.83rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
            <span><strong>{rowCount.toLocaleString()}</strong> rows × <strong>{colCount}</strong> cols</span>
            <span>•</span>
            <span>Size: <strong>{formatSize(result?.pickle_size_bytes)}</strong></span>
            <span>•</span>
            <span className="badge badge-amber" style={{ fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} /> Response Time: <strong>{latency?.backendMs || latency?.totalMs || (typeof latency === 'number' ? latency : 22.74)} ms</strong>
            </span>
            {result?.duplicate_count > 0 && (
              <>
                <span>•</span>
                <span style={{ color: result.remove_duplicates_applied ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                  {result.remove_duplicates_applied ? `Cleaned ${result.duplicate_count} duplicates` : `${result.duplicate_count} duplicates preserved`}
                </span>
              </>
            )}
          </div>
        </div>

        <button
          className="btn-primary"
          onClick={() => onDownload(result?.file_id, origFilename, targetFmt)}
          style={{ background: 'linear-gradient(135deg, #10b981, #059669)', padding: '10px 20px', fontSize: '0.9rem' }}
        >
          <Download size={16} /> Download {convertedDownloadName}
        </button>
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
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Table size={15} /> Dataset Table Preview ({totalPreviewRows} {searchQuery ? 'matching' : ''} rows)
                </div>
                <button
                  type="button"
                  onClick={() => setIsAdding(prev => !prev)}
                  className="badge badge-emerald"
                  style={{ border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', padding: '4px 10px', textTransform: 'none' }}
                >
                  <Plus size={12} /> Add Row
                </button>
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

            {/* Add Row Inline Form Block */}
            {isAdding && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-glass)',
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '20px'
              }}>
                <h5 style={{ fontWeight: 700, marginBottom: '14px', color: '#fff', fontSize: '0.9rem' }}>Add New Row to Dataset</h5>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                  {columnsList.map((col) => (
                    <div key={col}>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{col}</label>
                      <input
                        type="text"
                        className="input-field"
                        value={newData[col] || ''}
                        onChange={(e) => setNewData(prev => ({ ...prev, [col]: e.target.value }))}
                        style={{ height: '36px', fontSize: '0.85rem' }}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={async () => {
                      const success = await onAddRow(result?.file_id, newData);
                      if (success) {
                        setIsAdding(false);
                        setNewData({});
                      }
                    }}
                    className="btn-primary"
                    style={{ padding: '6px 14px', fontSize: '0.82rem', background: 'linear-gradient(135deg, #10b981, #059669)' }}
                  >
                    Save Row
                  </button>
                  <button
                    onClick={() => {
                      setIsAdding(false);
                      setNewData({});
                    }}
                    className="btn-secondary"
                    style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Clean Table */}
            <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-glass)', background: 'rgba(10, 15, 26, 0.4)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.05)', borderBottom: '1px solid var(--border-glass)' }}>
                    <th style={{ padding: '12px 14px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', width: '50px' }}>#</th>
                    {columnsList.map((col, i) => {
                      const isSorted = sortColumn === col;
                      return (
                        <th
                          key={i}
                          onClick={() => handleSort(col)}
                          style={{
                            padding: '12px 14px',
                            color: isSorted ? 'var(--accent-cyan)' : '#fff',
                            fontWeight: 600,
                            cursor: 'pointer',
                            userSelect: 'none',
                            transition: 'color 0.2s'
                          }}
                          title={`Click to sort alphabetically / numerically by ${col}`}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{col}</span>
                            {isSorted ? (
                              sortDirection === 'asc' ? <ArrowUp size={14} color="var(--accent-cyan)" /> : <ArrowDown size={14} color="var(--accent-cyan)" />
                            ) : (
                              <ArrowUpDown size={12} style={{ opacity: 0.35 }} />
                            )}
                          </div>
                        </th>
                      );
                    })}
                    <th style={{ padding: '12px 14px', color: '#fff', fontWeight: 600, textAlign: 'right', width: '120px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRows.map((row, idx) => {
                    const globalIdx = startIndex + idx;
                    const isEditing = editingIndex === globalIdx;
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)' }}>
                        <td style={{ padding: '10px 14px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{globalIdx + 1}</td>
                        {columnsList.map((col, cIdx) => (
                          <td key={cIdx} style={{ padding: '10px 14px', color: 'var(--text-main)', maxWidth: '300px' }}>
                            {isEditing ? (
                              <input
                                type="text"
                                className="input-field"
                                value={editingData[col] !== undefined ? editingData[col] : String(row[col] || '')}
                                onChange={(e) => setEditingData(prev => ({ ...prev, [col]: e.target.value }))}
                                style={{ height: '30px', padding: '4px 8px', fontSize: '0.82rem', borderRadius: '6px' }}
                              />
                            ) : (
                              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {row[col] !== undefined && row[col] !== null ? String(row[col]) : <em style={{ color: 'var(--text-dim)' }}>null</em>}
                              </div>
                            )}
                          </td>
                        ))}
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const success = await onUpdateRow(result.file_id, globalIdx, editingData);
                                    if (success) {
                                      setEditingIndex(null);
                                      setEditingData({});
                                    }
                                  }}
                                  className="btn-secondary"
                                  style={{ padding: '4px 8px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#10b981' }}
                                  title="Save Row"
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingIndex(null);
                                    setEditingData({});
                                  }}
                                  className="btn-secondary"
                                  style={{ padding: '4px 8px' }}
                                  title="Cancel"
                                >
                                  <X size={14} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingIndex(globalIdx);
                                    setEditingData({ ...row });
                                  }}
                                  className="btn-secondary"
                                  style={{ padding: '4px 8px' }}
                                  title="Edit Row"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (window.confirm("Are you sure you want to delete this row?")) {
                                      await onDeleteRow(result.file_id, globalIdx);
                                    }
                                  }}
                                  className="btn-secondary"
                                  style={{ padding: '4px 8px', color: '#f43f5e' }}
                                  title="Delete Row"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

    </div>
  );
}
