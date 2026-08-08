import React from 'react';

function AppHeader({ title, subtitle, sectors = [], onZoneClick }) {
  const activeSectors = sectors.filter(s => s.currentState === 'ACTIVE');
  
  const displayDots = activeSectors.slice(0, 3);
  const extraDots = activeSectors.length - 3;

  return (
    <header className="glass-panel" style={{ 
      display: 'flex', 
      flexDirection: 'column', // TRUCO 1: Cambiamos de fila a columna
      justifyContent: 'center', 
      gap: '2px', 
      marginBottom: '24px',
      padding: '16px 20px'
    }}>
      
      {/* --- NUEVA FILA 1: Eyebrow + Botón Mini-Mapa --- */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '4px' 
      }}>
        <p className="eyebrow" style={{ margin: 0 }}>Control de riego</p>
        
        {/* Indicador de Zonas (Mini-Mapa visual inteligente) */}
        {sectors.length > 0 && (
          <div 
            onClick={onZoneClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px', // Ligeramente más compacto para acompañar al texto pequeño
              borderRadius: '99px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--surface-border)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              flexShrink: 0 
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
      </div>

      {/* --- NUEVA FILA 2: Título Liberado (Ocupa 100% del ancho) --- */}
      <h1 style={{ 
        fontSize: '1.4rem', 
        marginBottom: '2px',
        whiteSpace: 'nowrap', 
        overflow: 'hidden', 
        textOverflow: 'ellipsis' // Se mantiene por seguridad extrema, pero ya no debería cortarse
      }}>
        {title}
      </h1>

      {/* --- NUEVA FILA 3: Subtítulo --- */}
      <p className="text-muted" style={{ fontSize: '0.85rem', margin: 0 }}>
        {subtitle}
      </p>

    </header>
  );
}

export default AppHeader;