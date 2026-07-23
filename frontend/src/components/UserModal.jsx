import React, { useState } from 'react';
import { UserPlus, UserCheck, X, AlertCircle } from 'lucide-react';

export function UserModal({ isOpen, onClose, currentUser, allUsers, onRegister, onSwitch }) {
  const [usernameInput, setUsernameInput] = useState('');
  const [localError, setLocalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!usernameInput.trim()) {
      setLocalError('Please enter a valid username');
      return;
    }
    setSubmitting(true);
    setLocalError('');
    try {
      await onRegister(usernameInput.trim());
      setUsernameInput('');
    } catch (err) {
      setLocalError(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '480px', padding: '28px', position: 'relative' }}>
        
        {/* Close button if user already exists */}
        {currentUser && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '10px', borderRadius: '12px' }}>
            <UserPlus size={22} color="var(--primary)" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>User Session Identifier</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Each conversion & request is uniquely tracked by user session.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {localError && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid var(--accent-rose)',
            padding: '10px 14px',
            borderRadius: '10px',
            color: 'var(--accent-rose)',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <AlertCircle size={16} />
            <span>{localError}</span>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
            Register New Unique Username
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. alex_dev, data_analyst"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              disabled={submitting}
            />
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Register'}
            </button>
          </div>
        </form>

        {/* Switch Existing Users */}
        {allUsers.length > 0 && (
          <div>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Switch to Existing Registered User
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
              {allUsers.map((u) => {
                const isSelected = currentUser && currentUser.id === u.id;
                return (
                  <div
                    key={u.id}
                    onClick={() => onSwitch(u)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-glass)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>@{u.username}</span>
                    {isSelected ? (
                      <span className="badge badge-emerald"><UserCheck size={12} /> Active</span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Click to Select</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
