import React, { useState, useEffect } from 'react';

export default function ConfigView({ appData }) {
  const { 
    sectors, configurations, handleToggleSector, handleSaveConfiguration, 
    handleCreateSector, newSector, setNewSector,
    handleToggleConfiguration, handleDeleteConfiguration // <-- Nuevas funciones
  } = appData;

  const [selectedTab, setSelectedTab] = useState(sectors[0]?.id || 'NEW');
  // NUEVO: Estado para saber si estamos en modo borrar alarmas
  const [isEditMode, setIsEditMode] = useState(false);
  const [quickConfig, setQuickConfig] = useState({ startTime: '06:00', durationMinutes: 15 });

  useEffect(() => {
    if (selectedTab !== 'NEW' && !sectors.find(s => s.id === selectedTab)) {
      setSelectedTab(sectors[0]?.id || 'NEW');
    }
    setIsEditMode(false); // Apagamos la edición si cambiamos de sector
  }, [sectors, selectedTab]);

  const selectedSectorObj = sectors.find(s => s.id === selectedTab);
  const sectorConfigs = configurations.filter(c => c.sectorId === selectedTab);

  // LOGICA DE ORDEN: Ordenamos cronológicamente (de la alarma más temprana a la más tarde)
  const sortedConfigs = [...sectorConfigs].sort((a, b) => {
    const timeA = typeof a.startTime === 'string' ? a.startTime : `${String(a.startTime.hour).padStart(2, '0')}:${String(a.startTime.minute).padStart(2, '0')}`;
    const timeB = typeof b.startTime === 'string' ? b.startTime : `${String(b.startTime.hour).padStart(2, '0')}:${String(b.startTime.minute).padStart(2, '0')}`;
    return timeA.localeCompare(timeB);
  });

  const onSaveQuickConfig = (e) => {
    e.preventDefault();
    handleSaveConfiguration({
      sectorId: selectedTab,
      startTime: quickConfig.startTime,
      durationMinutes: Number(quickConfig.durationMinutes),
      enabled: true,
    });
  };

  const formatTime = (timeObj) => {
    if (!timeObj) return '--:--';
    if (typeof timeObj === 'string') return timeObj;
    const h = String(timeObj.hour).padStart(2, '0');
    const m = String(timeObj.minute).padStart(2, '0');
    return `${h}:${m}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. Selector Horizontal (Chips Ordenados) */}
      <div className="tabs-container">
        <button className={`chip ${selectedTab === 'NEW' ? 'active' : ''}`} onClick={() => setSelectedTab('NEW')}>
          ➕ Nuevo
        </button>
        {sectors.filter(s => s.currentState === 'ACTIVE').map(sector => (
          <button key={sector.id} className={`chip ${selectedTab === sector.id ? 'active' : ''}`} onClick={() => setSelectedTab(sector.id)}>
            ✅ {sector.name}
          </button>
        ))}
        {sectors.filter(s => s.currentState !== 'ACTIVE').map(sector => (
          <button key={sector.id} className={`chip ${selectedTab === sector.id ? 'active' : ''}`} onClick={() => setSelectedTab(sector.id)} style={{ opacity: selectedTab === sector.id ? 1 : 0.6 }}>
            ⏸️ {sector.name}
          </button>
        ))}
      </div>

      {/* 2. Pantalla de Sector Seleccionado */}
      {selectedTab !== 'NEW' && selectedSectorObj && (
        <>
          {/* Panel Principal del Sector */}
          <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>{selectedSectorObj.name}</h3>
              <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '4px' }}>
                {selectedSectorObj.description || 'Sin descripción'}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className={`switch-toggle ${selectedSectorObj.currentState === 'ACTIVE' ? 'is-on' : 'is-off'}`}
                onClick={() => handleToggleSector(selectedSectorObj)}
              >
                <span className="switch-toggle__thumb" />
              </button>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: selectedSectorObj.currentState === 'ACTIVE' ? 'var(--primary)' : 'var(--text-muted)' }}>
                {selectedSectorObj.currentState === 'ACTIVE' ? 'HABILITADO' : 'DESHABILITADO'}
              </span>
            </div>
          </div>

          {/* Lista de Rutinas estilo App de Alarma */}
          <div className="glass-panel" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--primary)' }}>Rutinas Programadas</h3>
              {/* Botón de Editar / Listo */}
              {sectorConfigs.length > 0 && (
                <button 
                  onClick={() => setIsEditMode(!isEditMode)}
                  style={{ background: 'none', border: 'none', color: isEditMode ? 'var(--danger)' : 'var(--accent)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold' }}
                >
                  {isEditMode ? 'Listo' : 'Editar'}
                </button>
              )}
            </div>
            
            {sortedConfigs.length === 0 ? (
              <p className="text-muted" style={{ fontSize: '0.9rem', textAlign: 'center', padding: '10px' }}>No hay rutinas para este sector</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {sortedConfigs.map(c => (
                  <div key={c.id} style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                    background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '16px',
                    opacity: c.enabled ? 1 : 0.5, /* Se opaca si está apagada */
                    borderLeft: `4px solid ${c.enabled ? 'var(--primary)' : 'var(--text-muted)'}`,
                    transition: 'all 0.2s ease'
                  }}>
                    <div>
                      <h4 style={{ fontSize: '1.3rem', fontWeight: '700', color: c.enabled ? 'var(--text-main)' : 'var(--text-muted)' }}>
                        {formatTime(c.startTime)}
                      </h4>
                      <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '2px' }}>{c.durationMinutes} minutos</p>
                    </div>
                    
                    {/* Renderizamos el botón de basura o la palanca dependiendo del Modo */}
                    {isEditMode ? (
                      <button 
                        onClick={() => handleDeleteConfiguration(c.id)}
                        style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.2rem' }}
                        title="Borrar rutina"
                      >
                        🗑️
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={`switch-toggle ${c.enabled ? 'is-on' : 'is-off'}`}
                        onClick={() => handleToggleConfiguration(c)}
                      >
                        <span className="switch-toggle__thumb" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Formulario Rápido Arreglado (Diseño Clásico para 400px) */}
            <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '16px' }}>
              <p style={{ fontWeight: '600', marginBottom: '12px', fontSize: '0.9rem' }}>+ Agregar rutina</p>
              <form onSubmit={onSaveQuickConfig} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label>Hora</label>
                    <input type="time" value={quickConfig.startTime} onChange={e => setQuickConfig({...quickConfig, startTime: e.target.value})} required />
                  </div>
                  <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label>Minutos</label>
                    <input type="number" min="5" max="180" value={quickConfig.durationMinutes} onChange={e => setQuickConfig({...quickConfig, durationMinutes: e.target.value})} required />
                  </div>
                </div>
                <button type="submit" className="btn-primary" style={{ padding: '14px' }}>Guardar rutina</button>
              </form>
            </div>
          </div>
        </>
      )}

      {/* 3. Pantalla de Agregar Nuevo Sector */}
      {selectedTab === 'NEW' && (
        <div className="glass-panel">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '6px' }}>Crear Sector</h3>
          <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '20px' }}>Agrega una nueva zona de riego</p>
          
          <form onSubmit={(e) => {
            handleCreateSector(e, { defaultConfiguration: true, createConfiguration: false });
            setSelectedTab(sectors[0]?.id || 'NEW'); 
          }}>
            <div className="input-group">
              <label>Nombre del sector</label>
              <input type="text" value={newSector.name} onChange={e => setNewSector({...newSector, name: e.target.value})} placeholder="Ej. Patio trasero" required />
            </div>
            <div className="input-group" style={{ marginBottom: '24px' }}>
              <label>Descripción</label>
              <input type="text" value={newSector.description} onChange={e => setNewSector({...newSector, description: e.target.value})} placeholder="Ej. Zona de macetas" />
            </div>
            <button type="submit" className="btn-primary">Crear sector</button>
          </form>
        </div>
      )}
    </div>
  );
}