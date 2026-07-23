import React from 'react';

export default function DashboardView({ appData, setCurrentView }) {
  const { isActive, handleToggleMain, sectors, configurations, history } = appData;
  
  // 1. Lógica de Sectores Habilitados (Los que tienen el puntito verde)
  const enabledSectors = sectors.filter(s => s.enabled !== false);
  const enabledCount = enabledSectors.length;
  
  // 2. Lógica del Hardware (Por si se enciende solo por una rutina programada)
  const wateringSectors = sectors.filter(s => s.currentState === 'ACTIVE');
  const wateringCount = wateringSectors.length;
  
  // === LA NUEVA LÓGICA DEL MINI-MAPA ===
  // Se enciende si tocaste el botón manual (isActive) O si el hardware está regando por su cuenta
  const isMiniMapActive = isActive || wateringCount > 0;
  
  // Si encendiste manual, muestra los habilitados. Si es automático, muestra los que confirma el hardware.
  const displaySectors = isActive ? enabledSectors : wateringSectors;
  const displayCount = displaySectors.length;

  let heroSubtext = '';
  if (isActive) {
    if (enabledCount === 0) heroSubtext = 'Ningún sector habilitado';
    else if (enabledCount === 1) heroSubtext = `Regando: ${enabledSectors[0].name}`;
    else heroSubtext = `Regando: ${enabledCount} zonas`;
  } else {
    if (enabledCount === 0) heroSubtext = 'Sin sectores habilitados';
    else if (enabledCount === 1) heroSubtext = '1 zona lista para regar';
    else heroSubtext = `${enabledCount} zonas listas`;
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
        
        {/* === EL MINI-MAPA SINCRONIZADO === */}
        <div 
          className="glass-panel" 
          style={{ 
            cursor: 'pointer', padding: '16px',
            borderColor: isMiniMapActive ? 'var(--primary)' : 'var(--surface-border)',
            background: isMiniMapActive ? 'rgba(16, 185, 129, 0.05)' : 'var(--surface)'
          }} 
          onClick={() => setCurrentView('config')}
        >
          <p className="eyebrow" style={{ color: isMiniMapActive ? 'var(--primary)' : 'var(--accent)' }}>
            {isMiniMapActive ? 'En Proceso' : 'Próximo Riego'}
          </p>
          <h3 style={{ fontSize: '1.2rem', marginTop: '4px' }}>
            {isMiniMapActive 
              ? (displayCount === 1 ? displaySectors[0].name : `${displayCount} activos`) 
              : (nextConfig ? formatTime(nextConfig.startTime) : 'Sin programar')}
          </h3>
          <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '4px' }}>
            {isMiniMapActive ? 'Riego activo' : (nextConfig ? `${nextConfig.durationMinutes} min` : 'Toca para ajustar')}
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