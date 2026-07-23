import React from 'react';
import { UserCheck, ChevronDown, Database, ArrowRight, Zap, Search, Activity, Layers } from 'lucide-react';

export function Navbar({ currentUser, onOpenUserModal, activeTab, setActiveTab }) {
  return (
    <header className="glass-panel" style={{ borderRadius: '0 0 24px 24px', borderTop: 'none', padding: '18px 36px', marginBottom: '36px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '1320px', margin: '0 auto' }}>
        
        {/* Brand Logo & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
            width: '44px',
            height: '44px',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(99, 102, 241, 0.45)'
          }}>
            <Database size={22} color="#fff" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 800, background: 'linear-gradient(90deg, #ffffff 0%, #cbd5e1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' }}>
                File Converter
              </h1>
              <span className="badge badge-emerald" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>v1.0</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500, margin: '2px 0 0' }}>
              High-Performance CSV, JSON & Pickle Dataset Converter
            </p>
          </div>
        </div>

        {/* Floating Navigation Pill Tabs */}
        <nav style={{ display: 'flex', gap: '6px', background: 'rgba(6, 8, 16, 0.7)', padding: '6px', borderRadius: '16px', border: '1px solid var(--border-glass)' }}>
          <button
            onClick={() => setActiveTab('converter')}
            style={{
              background: activeTab === 'converter' ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'transparent',
              color: activeTab === 'converter' ? '#fff' : 'var(--text-muted)',
              border: 'none',
              padding: '9px 20px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: activeTab === 'converter' ? '0 4px 15px rgba(99, 102, 241, 0.4)' : 'none'
            }}
          >
            <Layers size={16} /> Converter
          </button>

          <button
            onClick={() => setActiveTab('history')}
            style={{
              background: activeTab === 'history' ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'transparent',
              color: activeTab === 'history' ? '#fff' : 'var(--text-muted)',
              border: 'none',
              padding: '9px 20px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: activeTab === 'history' ? '0 4px 15px rgba(99, 102, 241, 0.4)' : 'none'
            }}
          >
            <Search size={16} /> History & Search
          </button>
        </nav>

        {/* User Session Profile Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onOpenUserModal}
            className="btn-secondary"
            style={{
              padding: '8px 16px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-accent)'
            }}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <UserCheck size={17} color="var(--accent-cyan)" />
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: 'var(--accent-emerald)',
                position: 'absolute',
                top: '-1px',
                right: '-2px'
              }} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Session</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>
                {currentUser ? `@${currentUser.username}` : 'Select User'}
              </div>
            </div>
            <ChevronDown size={14} color="var(--text-muted)" />
          </button>
        </div>

      </div>
    </header>
  );
}
