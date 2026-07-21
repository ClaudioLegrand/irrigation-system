import React from 'react';

function AppHeader({ title, subtitle, sectors = [], onZoneClick }) {
  const activeSectors = sectors.filter(s => s.currentState === 'ACTIVE');
  
  const displayDots = activeSectors.slice(0, 3);
  const extraDots = activeSectors.length - 3;

  return (
    <header className="glass-panel" style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', // Alineamos al centro para que quede más equilibrado
      gap: '12px', // Damos un margen de respiración entre el título y el botón
      marginBottom: '24px',
      padding: '16px 20px'
    }}>
      {/* Añadimos flex: 1 y minWidth: 0 para que el título respete el espacio del botón */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="eyebrow">Control de riego</p>
        <h1 style={{ 
          fontSize: '1.4rem', 
          marginBottom: '4px',
          whiteSpace: 'nowrap', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis' // Si el título es muy largo, le pondrá "..."
        }}>
          {title}
        </h1>
        <p className="text-muted" style={{ fontSize: '0.85rem' }}>{subtitle}</p>
      </div>
      
      {/* Indicador de Zonas (Mini-Mapa visual inteligente) */}
      {sectors.length > 0 && (
        <div 
          onClick={onZoneClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            borderRadius: '99px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--surface-border)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap', /* TRUCO 1: Prohíbe que el texto baje de renglón */
            flexShrink: 0         /* TRUCO 2: Prohíbe que el título de la izq aplaste al botón */
          }}
          title="Gestionar sectores"
        >
          <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>
            {activeSectors.length} SECTORES
          </span>
          
          {activeSectors.length > 0 ? (
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              {displayDots.map((sector, index) => (
                <div 
                  key={sector.id || index}
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    boxShadow: '0 0 8px var(--primary-glow)'
                  }}
                />
              ))}
              {extraDots > 0 && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-main)', fontWeight: 'bold', marginLeft: '2px' }}>
                  +{extraDots}
                </span>
              )}
            </div>
          ) : (
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.15)' }} />
          )}
        </div>
      )}
    </header>
  );
}

export default AppHeader;