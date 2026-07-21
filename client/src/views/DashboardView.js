import React from 'react';

export default function DashboardView({ appData, setCurrentView }) {
  const { isActive, handleToggleMain, sectors, configurations, history } = appData;
  
  // Lógica inteligente para saber QUÉ se está regando
  const activeSectors = sectors.filter(s => s.currentState === 'ACTIVE');
  const activeCount = activeSectors.length;
  
  let heroSubtext = '';
  
  if (isActive) {
    // Si el botón está presionado (REGANDO)
    if (activeCount === 0) heroSubtext = 'Ningún sector habilitado';
    else if (activeCount === 1) heroSubtext = `Regando: ${activeSectors[0].name}`;
    else heroSubtext = `Regando: ${activeCount} zonas`;
  } else {
    // Si el botón está apagado (EN ESPERA)
    if (activeCount === 0) heroSubtext = 'Sin sectores habilitados';
    else if (activeCount === 1) heroSubtext = '1 zona lista para regar';
    else heroSubtext = `${activeCount} zonas listas`;
  }

  const formatTime = (timeObj) => {
    if (!timeObj) return '--:--';
    if (typeof timeObj === 'string') return timeObj;
    const h = String(timeObj.hour).padStart(2, '0');
    const m = String(timeObj.minute).padStart(2, '0');
    return `${h}:${m}`;
  };

  const nextConfig = configurations.length > 0 ? configurations[0] : null;
  const lastHistory = history.length > 0 ? history[0] : null;

  return (
    <div>
      <button 
        className={`hero-button ${isActive ? 'active' : 'inactive'}`}
        onClick={handleToggleMain}
      >
        {isActive ? (
          <>
            <span style={{ fontSize: '3.5rem', marginBottom: '10px' }}>💧</span>
            <span>APAGAR</span>
            <p>{heroSubtext}</p>
          </>
        ) : (
          <>
            <span style={{ fontSize: '3.5rem', marginBottom: '10px', filter: 'grayscale(1)' }}>🌱</span>
            <span>ENCENDER</span>
            <p>Iniciar manualmente</p>
          </>
        )}
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        
        {/* Tarjeta Camaleón: Cambia si está regando */}
        <div 
          className="glass-panel" 
          style={{ 
            cursor: 'pointer', padding: '16px',
            borderColor: isActive ? 'var(--primary)' : 'var(--surface-border)',
            background: isActive ? 'rgba(16, 185, 129, 0.05)' : 'var(--surface)'
          }} 
          onClick={() => setCurrentView('config')}
        >
          <p className="eyebrow" style={{ color: isActive ? 'var(--primary)' : 'var(--accent)' }}>
            {isActive ? 'En Proceso' : 'Próximo Riego'}
          </p>
          <h3 style={{ fontSize: '1.2rem', marginTop: '4px' }}>
            {isActive && activeCount > 0 
              ? (activeCount === 1 ? activeSectors[0].name : `${activeCount} activos`) 
              : (nextConfig ? formatTime(nextConfig.startTime) : 'Sin programar')}
          </h3>
          <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '4px' }}>
            {isActive ? 'Riego activo' : (nextConfig ? `${nextConfig.durationMinutes} min` : 'Toca para ajustar')}
          </p>
        </div>

        {/* Tarjeta de Historial */}
        <div className="glass-panel" style={{ cursor: 'pointer', padding: '16px' }} onClick={() => setCurrentView('history')}>
          <p className="eyebrow">Último Evento</p>
          <h3 style={{ fontSize: '1rem', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {lastHistory ? (lastHistory.originOrder || 'Manual') : 'Sin datos'}
          </h3>
          <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '4px' }}>
            {lastHistory ? (lastHistory.endDateTime ? 'Finalizado' : 'En curso') : 'Toca para ver'}
          </p>
        </div>

      </div>
    </div>
  );
}