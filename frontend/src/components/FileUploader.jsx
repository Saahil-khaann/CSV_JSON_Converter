import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, CheckCircle, ArrowRight, Zap, Filter, FileCode, Sparkles, RefreshCw, Cpu, Layers } from 'lucide-react';

export function FileUploader({ file, setFile, onConvert, converting, currentUser, removeDuplicates, setRemoveDuplicates, targetFormat = 'pkl', setTargetFormat }) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('Initializing conversion...');

  useEffect(() => {
    let timer;
    if (converting) {
      setProgress(5);
      setProgressStatus('Reading input dataset file...');

      timer = setInterval(() => {
        setProgress((prev) => {
          if (prev < 35) {
            setProgressStatus('Parsing dataset schema & rows...');
            return prev + 6;
          } else if (prev < 70) {
            setProgressStatus('Processing duplicate record filters...');
            return prev + 5;
          } else if (prev < 92) {
            setProgressStatus(`Serializing & encoding to .${targetFormat.toUpperCase()} format...`);
            return prev + 3;
          }
          return prev;
        });
      }, 100);
    } else {
      if (progress > 0) {
        setProgress(100);
        setProgressStatus('Conversion complete!');
        const timeout = setTimeout(() => {
          setProgress(0);
        }, 800);
        return () => clearTimeout(timeout);
      }
    }

    return () => clearInterval(timer);
  }, [converting, targetFormat]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (f) => {
    const ext = f.name.toLowerCase().split('.').pop();
    if (ext === 'csv' || ext === 'json') {
      setFile(f);
      if (ext === 'csv' && targetFormat === 'csv') {
        if (setTargetFormat) setTargetFormat('pkl');
      } else if (ext === 'json' && targetFormat === 'json') {
        if (setTargetFormat) setTargetFormat('pkl');
      }
    } else {
      alert('Only .csv and .json files are supported for conversion.');
    }
  };

  const fileExt = file ? file.name.toLowerCase().split('.').pop() : '';

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '36px', marginBottom: '32px' }}>

      {/* Animated Visual Hero Flow Graphic */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        
        {/* Animated Format Flow Nodes */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginBottom: '18px' }}>
          <div className="float-motion" style={{
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            color: 'var(--accent-amber)',
            borderRadius: '12px',
            padding: '6px 14px',
            fontWeight: 800,
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)'
          }}>
            <FileCode size={14} /> .CSV
          </div>

          <ArrowRight size={16} className="pulse" color="var(--primary)" />

          <div className="float-reverse" style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(6, 182, 212, 0.25))',
            border: '1px solid var(--primary)',
            color: '#fff',
            borderRadius: '14px',
            padding: '8px 18px',
            fontWeight: 800,
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.35)'
          }}>
            <Cpu size={16} color="var(--accent-cyan)" className="pulse" />
            <span>Converter Engine</span>
          </div>

          <ArrowRight size={16} className="pulse" color="var(--primary)" />

          <div className="float-motion" style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: 'var(--accent-emerald)',
            borderRadius: '12px',
            padding: '6px 14px',
            fontWeight: 800,
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)'
          }}>
            <Sparkles size={14} /> .PKL / .JSON
          </div>
        </div>

        <h2 style={{ fontSize: '1.55rem', fontWeight: 800, letterSpacing: '-0.5px', color: '#fff', marginBottom: '4px' }}>
          Dataset & Pickle Format Converter
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Convert dataset files between CSV, JSON, and compressed Pickle (.pkl) formats
        </p>
      </div>

      {/* Conversion Progress Bar */}
      {(converting || progress > 0) && (
        <div className="animate-fade-in" style={{
          marginBottom: '20px',
          background: 'rgba(12, 16, 29, 0.8)',
          border: '1px solid var(--border-accent)',
          borderRadius: '14px',
          padding: '16px 20px',
          boxShadow: '0 6px 20px rgba(99, 102, 241, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
              <Zap size={15} color="var(--accent-amber)" className="pulse" />
              <span>{progressStatus}</span>
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
              {Math.min(progress, 100)}%
            </span>
          </div>

          {/* Progress Bar Track */}
          <div style={{
            width: '100%',
            height: '8px',
            background: 'rgba(255, 255, 255, 0.06)',
            borderRadius: '9999px',
            overflow: 'hidden',
            border: '1px solid var(--border-glass)'
          }}>
            <div
              className="progress-shimmer"
              style={{
                width: `${Math.min(progress, 100)}%`,
                height: '100%',
                borderRadius: '9999px',
                transition: 'width 0.25s ease-out'
              }}
            />
          </div>
        </div>
      )}

      {/* Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: isDragging ? '2px dashed var(--primary)' : '2px dashed var(--border-glass)',
          background: isDragging ? 'rgba(99, 102, 241, 0.12)' : 'rgba(6, 8, 16, 0.5)',
          borderRadius: '16px',
          padding: '36px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.25s ease',
          boxShadow: isDragging ? '0 0 30px rgba(99, 102, 241, 0.35)' : 'none'
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv, .json"
          style={{ display: 'none' }}
        />

        <div style={{
          width: '56px',
          height: '56px',
          margin: '0 auto 14px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(6, 182, 212, 0.15))',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 6px 16px rgba(0, 0, 0, 0.3)'
        }}>
          <UploadCloud size={28} color="var(--primary)" />
        </div>

        {file ? (
          <div>
            <span className="badge badge-emerald" style={{ marginBottom: '8px' }}>
              <CheckCircle size={12} /> Ready to convert
            </span>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, margin: '6px 0 2px', color: '#fff' }}>
              {file.name}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Size: <strong style={{ color: '#fff' }}>{formatFileSize(file.size)}</strong> | Format: <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>.{file.name.split('.').pop().toUpperCase()}</span>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
              Drag and drop dataset here, or browse
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Supports .CSV & .JSON files up to 100MB
            </div>
          </div>
        )}
      </div>

      {/* Options Bar & Target Format Selector */}
      {file && (
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-glass)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Target Format Selector */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', background: 'rgba(255, 255, 255, 0.02)', padding: '12px 18px', borderRadius: '14px', border: '1px solid var(--border-glass)' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Target Output Format:
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { id: 'pkl', label: 'Pickle (.pkl)', disabled: false },
                  { id: 'json', label: 'JSON (.json)', disabled: fileExt === 'json' },
                  { id: 'csv', label: 'CSV (.csv)', disabled: fileExt === 'csv' }
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    disabled={fmt.disabled}
                    onClick={() => !fmt.disabled && setTargetFormat && setTargetFormat(fmt.id)}
                    title={fmt.disabled ? `Cannot convert ${fileExt.toUpperCase()} to ${fmt.id.toUpperCase()} (Same format)` : ''}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '10px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: fmt.disabled ? 'not-allowed' : 'pointer',
                      opacity: fmt.disabled ? 0.35 : 1,
                      border: targetFormat === fmt.id ? '2px solid var(--primary)' : '1px solid var(--border-glass)',
                      background: targetFormat === fmt.id ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                      color: targetFormat === fmt.id ? '#fff' : 'var(--text-muted)',
                      transition: 'all 0.2s'
                    }}
                  >
                    {fmt.label} {fmt.disabled ? '(Same Format)' : ''}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>

              {/* Deduplication Switch Box */}
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-glass)',
                padding: '10px 18px',
                borderRadius: '14px',
                cursor: 'pointer',
                fontSize: '0.88rem',
                userSelect: 'none',
                transition: 'all 0.2s'
              }}>
                <input
                  type="checkbox"
                  checked={removeDuplicates}
                  onChange={(e) => setRemoveDuplicates(e.target.checked)}
                  style={{ width: '17px', height: '17px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
                <Sparkles size={16} color="var(--accent-amber)" />
                <span>
                  <strong>Remove Duplicate Records</strong>
                </span>
              </label>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  className="btn-secondary"
                  onClick={() => setFile(null)}
                  disabled={converting}
                >
                  Clear Selection
                </button>

                <button
                  className="btn-primary"
                  onClick={() => onConvert(file, currentUser?.id, removeDuplicates, targetFormat)}
                  disabled={converting || !currentUser}
                  style={{ padding: '12px 32px', fontSize: '1rem' }}
                >
                  {converting ? (
                    <>
                      <Zap size={18} className="pulse" /> Converting to .{targetFormat.toUpperCase()}...
                    </>
                  ) : (
                    <>
                      Convert to .{targetFormat.toUpperCase()} <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
