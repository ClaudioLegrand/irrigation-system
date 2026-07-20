import React, { useState, useEffect } from 'react';

export default function ConfigView({ appData }) {
  const { 
    sectors, configurations, handleToggleSector, handleSaveConfiguration, 
    handleCreateSector, newSector, setNewSector 
  } = appData;

  // Estado para saber qué pestaña estamos mirando
  const [selectedTab, setSelectedTab] = useState(sectors[0]?.id || 'NEW');

  // Si se crea un sector nuevo, asegurar que la pestaña no quede en un ID fantasma
  useEffect(() => {
    if (selectedTab !== 'NEW' && !sectors.find(s => s.id === selectedTab)) {
      setSelectedTab(sectors[0]?.id || 'NEW');
    }
  }, [sectors, selectedTab]);

  const selectedSectorObj = sectors.find(s => s.id === selectedTab);
  const sectorConfigs = configurations.filter(c => c.sectorId === selectedTab);

  // Estado local simplificado para el formulario rápido de rutina
  const [quickConfig, setQuickConfig] = useState({ startTime: '06:00', durationMinutes: 15 });

  const onSaveQuickConfig = (e) => {
    e.preventDefault();
    handleSaveConfiguration({
      sectorId: selectedTab,
      startTime: quickConfig.startTime,
      durationMinutes: Number(quickConfig.durationMinutes),
      enabled: true, // Por defecto al crearla rápido la dejamos activa
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
      
      {/* 1. Selector Horizontal (Chips) */}
      <div className="tabs-container">
        {sectors.map(sector => (
          <button 
            key={sector.id} 
            className={`chip ${selectedTab === sector.id ? 'active' : ''}`}
            onClick={() => setSelectedTab(sector.id)}
          >
            {sector.currentState === 'ACTIVE' ? '💧 ' : '🌱 '}
            {sector.name}
          </button>
        ))}
        <button 
          className={`chip ${selectedTab === 'NEW' ? 'active' : ''}`}
          onClick={() => setSelectedTab('NEW')}
        >
          ➕ Nuevo
        </button>
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
            
            {/* Switch para encendido manual del sector */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className={`switch-toggle ${selectedSectorObj.currentState === 'ACTIVE' ? 'is-on' : 'is-off'}`}
                onClick={() => handleToggleSector(selectedSectorObj)}
              >
                <span className="switch-toggle__thumb" />
              </button>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: selectedSectorObj.currentState === 'ACTIVE' ? 'var(--primary)' : 'var(--text-muted)' }}>
                {selectedSectorObj.currentState === 'ACTIVE' ? 'ACTIVO' : 'OFF'}
              </span>
            </div>
          </div>

          {/* Lista de Rutinas del Sector */}
          <div className="glass-panel" style={{ padding: '16px' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '16px', color: 'var(--primary)' }}>Rutinas Programadas</h3>
            
            {sectorConfigs.length === 0 ? (
              <p className="text-muted" style={{ fontSize: '0.9rem', textAlign: 'center', padding: '10px' }}>No hay rutinas para este sector</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {sectorConfigs.map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px' }}>
                    <span style={{ fontWeight: '600' }}>{formatTime(c.startTime)}</span>
                    <span className="text-muted">{c.durationMinutes} min</span>
                  </div>
                ))}
              </div>
            )}

            {/* Formulario Rápido Oculto (Agregar Rutina) */}
            <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '16px' }}>
              <p style={{ fontWeight: '600', marginBottom: '12px', fontSize: '0.9rem' }}>+ Agregar rutina</p>
              <form onSubmit={onSaveQuickConfig} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Hora</label>
                  <input type="time" value={quickConfig.startTime} onChange={e => setQuickConfig({...quickConfig, startTime: e.target.value})} />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Minutos</label>
                  <input type="number" min="5" value={quickConfig.durationMinutes} onChange={e => setQuickConfig({...quickConfig, durationMinutes: e.target.value})} />
                </div>
                <button type="submit" className="btn-primary" style={{ padding: '12px 16px', borderRadius: '12px' }}>✓</button>
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
            setSelectedTab(sectors[0]?.id || 'NEW'); // Volver al primer sector luego de crear
          }}>
            <div className="input-group">
              <label>Nombre del sector</label>
              <input type="text" value={newSector.name} onChange={e => setNewSector({...newSector, name: e.target.value})} placeholder="Ej. Patio trasero" />
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