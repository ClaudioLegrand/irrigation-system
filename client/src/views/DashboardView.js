import React from 'react';

export default function DashboardView({ appData, setCurrentView }) {
  const { isActive, handleToggleMain, sectors, configurations, history } = appData;
  
  // Datos para los resúmenes
  const activeSectorsCount = sectors.filter(s => s.currentState === 'ACTIVE').length;
  const nextConfig = configurations.length > 0 ? configurations[0] : null;
  const lastHistory = history.length > 0 ? history[0] : null;

  // Manejo seguro del objeto LocalTime del Backend
  const formatTime = (timeObj) => {
    if (!timeObj) return '--:--';
    if (typeof timeObj === 'string') return timeObj; // Por si viene como string "06:00"
    const h = String(timeObj.hour).padStart(2, '0');
    const m = String(timeObj.minute).padStart(2, '0');
    return `${h}:${m}`;
  };

  return (
    <div>
      {/* Botón Héroe Interactivo */}
      <button 
        className={`hero-button ${isActive ? 'active' : 'inactive'}`}
        onClick={handleToggleMain}
      >
        {isActive ? (
          <>
            <span style={{ fontSize: '3.5rem', marginBottom: '10px' }}>💧</span>
            <span>APAGAR RIEGO</span>
            <p>{activeSectorsCount} sector(es) activo(s)</p>
          </>
        ) : (
          <>
            <span style={{ fontSize: '3.5rem', marginBottom: '10px', filter: 'grayscale(1)' }}>🌱</span>
            <span>ENCENDER RIEGO</span>
            <p>Iniciar manualmente</p>
          </>
        )}
      </button>

      {/* Tarjetas Inteligentes (Accesos rápidos) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        
        <div className="glass-panel" style={{ cursor: 'pointer', padding: '16px' }} onClick={() => setCurrentView('config')}>
          <p className="eyebrow">Próximo Riego</p>
          <h3 style={{ fontSize: '1.2rem', marginTop: '4px' }}>
            {nextConfig ? formatTime(nextConfig.startTime) : 'Sin programar'}
          </h3>
          <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '4px' }}>
            {nextConfig ? `${nextConfig.durationMinutes} min` : 'Toca para ajustar'}
          </p>
        </div>

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