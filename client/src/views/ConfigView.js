import React, { useState, useEffect } from 'react';

export default function ConfigView({ appData }) {
  const { 
    sectors, configurations, handleToggleSector, handleSaveConfiguration, 
    handleCreateSector, newSector, setNewSector,
    handleToggleConfiguration, handleDeleteConfiguration, newConfiguration, setNewConfiguration
  } = appData;

  const [selectedTab, setSelectedTab] = useState(sectors[0]?.id || 'NEW');
  const [isEditMode, setIsEditMode] = useState(false);
  const [quickConfig, setQuickConfig] = useState({ startTime: '06:00', durationMinutes: 15 });
  const [localError, setLocalError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (selectedTab !== 'NEW' && !sectors.find(s => s.id === selectedTab)) {
      setSelectedTab(sectors[0]?.id || 'NEW');
    }
    setIsEditMode(false);
    setLocalError(''); // Limpiamos errores al cambiar de pestaña
  }, [sectors, selectedTab]);

  const selectedSectorObj = sectors.find(s => s.id === selectedTab);
  const sectorConfigs = configurations.filter(c => c.sectorId === selectedTab);

  const formatTime = (timeObj) => {
    if (!timeObj) return '--:--';
    // FIX: Si viene de la base de datos como "06:00:00", extraemos solo "06:00"
    if (typeof timeObj === 'string') return timeObj.substring(0, 5); 
    const h = String(timeObj.hour).padStart(2, '0');
    const m = String(timeObj.minute).padStart(2, '0');
    return `${h}:${m}`;
  };

  const sortedConfigs = [...sectorConfigs].sort((a, b) => {
    const timeA = formatTime(a.startTime);
    const timeB = formatTime(b.startTime);
    return timeA.localeCompare(timeB);
  });

  const onSaveQuickConfig = async (e) => { // <-- IMPORTANTE: Ahora es async
    e.preventDefault();
    
    // ESCUDO: Si ya se está guardando, ignorar cualquier otro clic accidental
    if (isSaving) return; 

    setLocalError(''); 

    const timeToSave = quickConfig.startTime;
    const isDuplicate = sectorConfigs.some(c => formatTime(c.startTime) === timeToSave);

    if (isDuplicate) {
      setLocalError(`Ya tienes una rutina programada a las ${timeToSave}.`);
      return; 
    }

    setIsSaving(true); // Bloqueamos la interfaz
    
    try {
      // Esperamos a que termine de guardar en el backend
      await handleSaveConfiguration({
        sectorId: selectedTab,
        startTime: quickConfig.startTime,
        durationMinutes: Number(quickConfig.durationMinutes),
        enabled: true,
      });
      
      // UX: Limpiamos la hora para que no quede escrita y evitar que guarde lo mismo por error
      setQuickConfig({ startTime: '', durationMinutes: 15 });
      
    } finally {
      setIsSaving(false); // Liberamos el botón, pase lo que pase
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. Selector Horizontal (Chips) */}
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
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                className={`switch-toggle ${selectedSectorObj.currentState === 'ACTIVE' ? 'is-on' : 'is-off'}`}
                onClick={() => handleToggleSector(selectedSectorObj)}
              >
                <span className="switch-toggle__thumb" />
              </button>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: selectedSectorObj.currentState === 'ACTIVE' ? 'var(--primary)' : 'var(--text-muted)' }}>
                  {selectedSectorObj.currentState === 'ACTIVE' ? 'HABILITADO' : 'DESHABILITADO'}
                </div>
                {/* Nuevo subtítulo sutil en lugar del cartel gigante */}
                {selectedSectorObj.currentState !== 'ACTIVE' && (
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px', opacity: 0.8 }}>
                    (Rutinas pausadas)
                  </div>
                )}
              </div>
            </div>
          </div>
          

          {/* Bloque 1: Lista de Rutinas (AHORA SEPARADO) */}
          <div className="glass-panel" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>Rutinas Programadas</h3>
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
              <p className="text-muted" style={{ fontSize: '0.9rem', textAlign: 'center', padding: '20px 10px' }}>
                No tienes ninguna rutina programada.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {sortedConfigs.map((c, index) => (
                  <div key={c.id} className="list-item-enter" style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                    background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '16px',
                    opacity: c.enabled ? 1 : 0.5,
                    borderLeft: `4px solid ${c.enabled ? 'var(--primary)' : 'var(--text-muted)'}`,
                    transition: 'all 0.2s ease'
                  }}>
                    <div>
                      <h4 style={{ fontSize: '1.3rem', fontWeight: '700', color: c.enabled ? 'var(--text-main)' : 'var(--text-muted)' }}>
                        {formatTime(c.startTime)}
                      </h4>
                      <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '2px' }}>{c.durationMinutes} minutos</p>
                    </div>
                    
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
          </div>

          {/* Bloque 2: Formulario Nueva Rutina (AHORA SEPARADO) */}
          <div className="glass-panel" style={{ padding: '16px' }}>
             {/* El título ahora comparte jerarquía y color */}
            <h3 style={{ fontSize: '1.1rem', color: 'var(--primary)', marginBottom: '16px' }}>
              Nueva Rutina
            </h3>
            
            {localError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                {localError}
              </div>
            )}

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
              <button 
                type="submit" 
                className="btn-primary" 
                style={{ padding: '14px', opacity: isSaving ? 0.7 : 1 }}
                disabled={isSaving}
              >
                {isSaving ? 'Guardando...' : 'Crear rutina'}
              </button>
            </form>
          </div>
        </>
      )}

      {/* 3. Pantalla de Agregar Nuevo Sector */}
      {selectedTab === 'NEW' && (
        <div className="glass-panel">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '6px' }}>Crear Sector</h3>
          <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '20px' }}>Agrega una nueva zona de riego</p>
          
          <form onSubmit={(e) => {
            handleCreateSector(e, { 
              defaultConfiguration: newSector.defaultConfiguration, 
              createConfiguration: newSector.defaultConfiguration 
            });
            setSelectedTab(sectors[0]?.id || 'NEW'); 
          }}>
            <div className="input-group">
              <label>Nombre del sector</label>
              <input type="text" value={newSector.name} onChange={e => setNewSector({...newSector, name: e.target.value})} placeholder="Ej. Patio trasero" />
            </div>
            <div className="input-group">
              <label>Descripción</label>
              <input type="text" value={newSector.description} onChange={e => setNewSector({...newSector, description: e.target.value})} placeholder="Ej. Zona de macetas" />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0 16px 0', borderTop: '1px solid var(--surface-border)', paddingTop: '16px' }}>
              <div>
                <p style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.95rem' }}>Añadir rutina inicial</p>
              </div>
              <button
                type="button"
                className={`switch-toggle ${newSector.defaultConfiguration ? 'is-on' : 'is-off'}`}
                onClick={() => setNewSector(prev => ({ ...prev, defaultConfiguration: !prev.defaultConfiguration }))}
              >
                <span className="switch-toggle__thumb" />
              </button>
            </div>

            {newSector.defaultConfiguration && (
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Hora</label>
                  <input type="time" value={newConfiguration.startTime} onChange={e => setNewConfiguration({...newConfiguration, startTime: e.target.value})} required={newSector.defaultConfiguration} />
                </div>
                <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Min</label>
                  <input type="number" min="5" value={newConfiguration.durationMinutes} onChange={e => setNewConfiguration({...newConfiguration, durationMinutes: e.target.value})} required={newSector.defaultConfiguration} />
                </div>
              </div>
            )}

            <button type="submit" className="btn-primary" style={{ marginTop: newSector.defaultConfiguration ? 0 : '16px' }}>
              {newSector.defaultConfiguration ? 'Crear sector y rutina' : 'Crear sector'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}