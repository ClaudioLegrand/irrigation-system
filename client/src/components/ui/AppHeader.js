import React from 'react';

function AppHeader({ title, subtitle, status }) {
  return (
    <header className="glass-panel" style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'flex-start',
      marginBottom: '24px',
      padding: '16px 20px'
    }}>
      <div>
        <p className="eyebrow">Control de riego</p>
        <h1 style={{ fontSize: '1.4rem', marginBottom: '4px' }}>{title}</h1>
        <p className="text-muted" style={{ fontSize: '0.85rem' }}>{subtitle}</p>
      </div>
      
      <div style={{
        padding: '6px 12px',
        borderRadius: '99px',
        fontSize: '0.8rem',
        fontWeight: 'bold',
        background: status === 'Activo' ? 'var(--primary-glow)' : 'rgba(255,255,255,0.05)',
        color: status === 'Activo' ? 'var(--primary)' : 'var(--text-muted)',
        border: `1px solid ${status === 'Activo' ? 'var(--primary)' : 'transparent'}`
      }}>
        {status}
      </div>
    </header>
  );
}

export default AppHeader;
