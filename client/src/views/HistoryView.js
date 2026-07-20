import React from 'react';

export default function HistoryView({ appData }) {
  const { history } = appData;

  const formatDate = (isoString) => {
    if (!isoString) return 'Fecha desconocida';
    const date = new Date(isoString);
    return date.toLocaleString('es-AR', { 
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
    });
  };

  return (
    <div className="glass-panel">
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.2rem' }}>Historial de Riego</h3>
        <p className="text-muted">Registro de las últimas actividades</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', opacity: 0.5 }}>
            <span style={{ fontSize: '2rem' }}>📭</span>
            <p style={{ marginTop: '10px' }}>Aún no hay registros</p>
          </div>
        ) : (
          history.map(item => (
            <div key={item.id} style={{ 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
              padding: '16px', background: 'rgba(255,255,255,0.02)', 
              borderRadius: '16px', borderLeft: `4px solid ${item.endDateTime ? 'var(--text-muted)' : 'var(--primary)'}`
            }}>
              <div>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '4px' }}>
                  {item.originOrder || 'Riego Manual'}
                </h4>
                <p className="text-muted" style={{ fontSize: '0.8rem' }}>
                  {formatDate(item.startDateTime)}
                </p>
              </div>
              <span style={{ 
                fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 8px', borderRadius: '8px',
                background: item.endDateTime ? 'rgba(255,255,255,0.1)' : 'var(--primary-glow)',
                color: item.endDateTime ? 'var(--text-muted)' : 'var(--primary)'
              }}>
                {item.endDateTime ? 'Finalizado' : 'Activo'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}