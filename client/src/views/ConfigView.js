import React, { useState, useEffect } from 'react';

export default function ConfigView({ appData }) {
  const { 
    sectors, configurations, handleToggleSector, handleSaveConfiguration, 
    handleCreateSector, newSector, setNewSector,
    handleToggleConfiguration, handleDeleteConfiguration,
    newConfiguration, setNewConfiguration,
    handleUpdateRoutine,
    lastSectorId, setLastSectorId // <-- 1. Recibimos la memoria global
  } = appData;

  // 2. Lógica inteligente: Si hay un último sector, úsalo. Si no, usa el primero.
  const [localTab, setLocalTab] = useState(sectors[0]?.id || 'NEW');
  const selectedTab = lastSectorId || localTab;

  const handleSetTab = (id) => {
    if (setLastSectorId) setLastSectorId(id); // Guarda globalmente
    setLocalTab(id); // Guarda localmente por si acaso
  };

  const [quickConfig, setQuickConfig] = useState({ startTime: '', durationMinutes: 15 });
  const [localError, setLocalError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const [editingRoutineId, setEditingRoutineId] = useState(null);
  const [editData, setEditData] = useState({ startTime: '', durationMinutes: 15 });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingIds, setDeletingIds] = useState([]);

  useEffect(() => {
    if (selectedTab !== 'NEW' && !sectors.find(s => s.id === selectedTab)) {
      handleSetTab(sectors[0]?.id || 'NEW');
    }
    cancelEditing(); 
  }, [sectors, selectedTab]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (e.target.closest('.editing-card')) return;
      cancelEditing();
    };

    if (editingRoutineId) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [editingRoutineId]);

  const selectedSectorObj = sectors.find(s => s.id === selectedTab);
  const sectorConfigs = configurations.filter(c => c.sectorId === selectedTab);

  const formatTime = (timeObj) => {
    if (!timeObj) return '--:--';
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

  const onSaveQuickConfig = async (e) => {
    e.preventDefault();
    if (isSaving) return; 
    setLocalError(''); 

    const timeToSave = quickConfig.startTime;
    const isDuplicate = sectorConfigs.some(c => formatTime(c.startTime) === timeToSave);

    if (isDuplicate) {
      setLocalError(`Ya tienes una rutina programada a las ${timeToSave}.`);
      return; 
    }

    setIsSaving(true);
    try {
      await handleSaveConfiguration({
        sectorId: selectedTab,
        startTime: quickConfig.startTime,
        durationMinutes: Number(quickConfig.durationMinutes),
        enabled: true,
      });
      setQuickConfig({ startTime: '', durationMinutes: 15 });
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = (routine) => {
    setLocalError('');
    setConfirmDeleteId(null); 
    setEditingRoutineId(routine.id);
    setEditData({
      startTime: formatTime(routine.startTime),
      durationMinutes: routine.durationMinutes
    });
  };

  const cancelEditing = () => {
    setEditingRoutineId(null);
    setLocalError('');
    setConfirmDeleteId(null);
  };

  const saveEdit = async (e, originalRoutine) => {
    e.preventDefault();
    setLocalError('');

    const timeToSave = editData.startTime;
    const isDuplicate = sectorConfigs.some(
      c => c.id !== originalRoutine.id && formatTime(c.startTime) === timeToSave
    );

    if (isDuplicate) {
      setLocalError(`Ya existe otra rutina a las ${timeToSave}.`);
      return;
    }

    await handleUpdateRoutine(originalRoutine.id, {
      ...originalRoutine,
      startTime: editData.startTime,
      durationMinutes: Number(editData.durationMinutes)
    });

    cancelEditing(); 
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      <div className="tabs-header-layout">
        <button 
          className={`btn-fixed-new ${selectedTab === 'NEW' ? 'active' : ''}`} 
          onClick={() => handleSetTab('NEW')}
          title="Crear nuevo sector"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>

        <div 
          className="tabs-scroll-area"
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          {sectors.filter(s => s.currentState === 'ACTIVE').map(sector => (
            <button key={sector.id} className={`chip ${selectedTab === sector.id ? 'active' : ''}`} onClick={() => handleSetTab(sector.id)} style={{ display: 'flex', alignItems: 'center' }}>
              <span className="icon-active-dot"></span>{sector.name}
            </button>
          ))}
          
          {sectors.filter(s => s.currentState !== 'ACTIVE').map(sector => (
            <button key={sector.id} className={`chip ${selectedTab === sector.id ? 'active' : ''}`} onClick={() => handleSetTab(sector.id)} style={{ display: 'flex', alignItems: 'center', opacity: selectedTab === sector.id ? 1 : 0.6 }}>
              <svg className="icon-paused" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" rx="1"></rect><rect x="14" y="4" width="4" height="16" rx="1"></rect></svg>
              {sector.name}
            </button>
          ))}
        </div>
      </div>

      {selectedTab !== 'NEW' && selectedSectorObj && (
        <>
          <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>{selectedSectorObj.name}</h3>
              <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '4px' }}>
                {selectedSectorObj.description || 'Sin descripción'}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <button type="button" className={`switch-toggle ${selectedSectorObj.currentState === 'ACTIVE' ? 'is-on' : 'is-off'}`} onClick={() => handleToggleSector(selectedSectorObj)}>
                <span className="switch-toggle__thumb" />
              </button>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: selectedSectorObj.currentState === 'ACTIVE' ? 'var(--primary)' : 'var(--text-muted)' }}>
                  {selectedSectorObj.currentState === 'ACTIVE' ? 'HABILITADO' : 'DESHABILITADO'}
                </div>
                {selectedSectorObj.currentState !== 'ACTIVE' && (
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px', opacity: 0.8 }}>
                    (Rutinas pausadas)
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '16px' }}>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>Rutinas Programadas</h3>
            </div>
            
            {sortedConfigs.length === 0 ? (
              <p className="text-muted" style={{ fontSize: '0.9rem', textAlign: 'center', padding: '20px 10px' }}>No tienes ninguna rutina programada.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {sortedConfigs.map((c) => {
                  const isEditing = editingRoutineId === c.id;
                  const isDeleting = deletingIds.includes(c.id);
                  
                  return (
                    <div 
                      key={c.id} 
                      className={`list-item-enter ${isEditing ? 'editing-card' : ''} ${isDeleting ? 'list-item-exit' : ''}`} 
                      style={{ 
                        background: isEditing ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '16px',
                        opacity: c.enabled || isEditing ? 1 : 0.5, borderLeft: `4px solid ${c.enabled ? 'var(--primary)' : 'var(--text-muted)'}`,
                        transition: 'all 0.3s ease', cursor: isEditing ? 'default' : 'pointer'
                      }}
                      onClick={() => { if (!isEditing && !isDeleting) startEditing(c); }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h4 style={{ fontSize: '1.3rem', fontWeight: '700', color: c.enabled ? 'var(--text-main)' : 'var(--text-muted)' }}>
                            {formatTime(c.startTime)}
                          </h4>
                          {/* 3. FIX: Ahora los minutos también se hacen transparentes si está apagado */}
                          <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '2px', opacity: c.enabled ? 1 : 0.4 }}>
                            {c.durationMinutes} minutos
                          </p>
                        </div>
                        
                        {isEditing ? (
                          <button type="button" onClick={(e) => { e.stopPropagation(); cancelEditing(); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', padding: '8px', cursor: 'pointer' }}>✕</button>
                        ) : (
                          <button type="button" className={`switch-toggle ${c.enabled ? 'is-on' : 'is-off'}`} onClick={(e) => { e.stopPropagation(); handleToggleConfiguration(c); }}>
                            <span className="switch-toggle__thumb" />
                          </button>
                        )}
                      </div>

                      <div className={`accordion-wrapper ${isEditing ? 'expanded' : ''}`}>
                        <div className="accordion-content">
                          <form onSubmit={(e) => saveEdit(e, c)} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '16px' }}>
                            <div style={{ display: 'flex', gap: '12px' }}>
                              <div className="input-group" style={{ flex: 1, marginBottom: 0 }}><label style={{ fontSize: '0.8rem' }}>Hora</label><input type="time" value={editData.startTime} onChange={e => setEditData({...editData, startTime: e.target.value})} required /></div>
                              <div className="input-group" style={{ flex: 1, marginBottom: 0 }}><label style={{ fontSize: '0.8rem' }}>Minutos</label><input type="number" min="5" max="180" value={editData.durationMinutes} onChange={e => setEditData({...editData, durationMinutes: e.target.value})} required /></div>
                            </div>
                            
                            {localError && <div style={{ color: '#fca5a5', fontSize: '0.8rem' }}>{localError}</div>}
                            
                            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                              <button type="submit" className="btn-primary" style={{ flex: 1, padding: '12px', fontSize: '0.9rem', margin: 0 }}>Guardar</button>
                              <button 
                                type="button" 
                                onClick={(e) => { 
                                  e.stopPropagation();
                                  if (confirmDeleteId === c.id) {
                                    setDeletingIds(prev => [...prev, c.id]);
                                    setTimeout(() => { handleDeleteConfiguration(c.id); }, 400);
                                  } else {
                                    setConfirmDeleteId(c.id);
                                  }
                                }} 
                                style={{ 
                                  flex: 1, padding: '12px', fontSize: '0.9rem', fontWeight: 'bold', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s ease',
                                  border: confirmDeleteId === c.id ? 'none' : '1px solid rgba(239, 68, 68, 0.3)',
                                  background: confirmDeleteId === c.id ? 'var(--danger)' : 'transparent', color: confirmDeleteId === c.id ? '#ffffff' : 'var(--danger)', margin: 0
                                }}
                              >
                                {confirmDeleteId === c.id ? '¿Seguro?' : 'Eliminar'}
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="glass-panel" style={{ padding: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--primary)', marginBottom: '16px' }}>Nueva Rutina</h3>
            {localError && !editingRoutineId && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>{localError}</div>}
            <form onSubmit={onSaveQuickConfig} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="input-group" style={{ flex: 1, marginBottom: 0 }}><label>Hora</label><input type="time" value={quickConfig.startTime} onChange={e => setQuickConfig({...quickConfig, startTime: e.target.value})} required /></div>
                <div className="input-group" style={{ flex: 1, marginBottom: 0 }}><label>Minutos</label><input type="number" min="5" max="180" value={quickConfig.durationMinutes} onChange={e => setQuickConfig({...quickConfig, durationMinutes: e.target.value})} required /></div>
              </div>
              <button type="submit" className="btn-primary" style={{ padding: '14px', opacity: isSaving ? 0.7 : 1 }} disabled={isSaving}>{isSaving ? 'Guardando...' : 'Crear rutina'}</button>
            </form>
          </div>
        </>
      )}

      {selectedTab === 'NEW' && (
        <div className="glass-panel">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '6px' }}>Crear Sector</h3>
          <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '20px' }}>Agrega una nueva zona de riego</p>
          <form onSubmit={(e) => { handleCreateSector(e, { defaultConfiguration: newSector.defaultConfiguration, createConfiguration: newSector.defaultConfiguration }); handleSetTab(sectors[0]?.id || 'NEW'); }}>
            <div className="input-group"><label>Nombre del sector</label><input type="text" value={newSector.name} onChange={e => setNewSector({...newSector, name: e.target.value})} placeholder="Ej. Patio trasero" /></div>
            <div className="input-group"><label>Descripción</label><input type="text" value={newSector.description} onChange={e => setNewSector({...newSector, description: e.target.value})} placeholder="Ej. Zona de macetas" /></div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0 0 0', borderTop: '1px solid var(--surface-border)', paddingTop: '16px' }}>
              <div><p style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.95rem' }}>Añadir rutina inicial</p></div>
              <button type="button" className={`switch-toggle ${newSector.defaultConfiguration ? 'is-on' : 'is-off'}`} onClick={() => setNewSector(prev => ({ ...prev, defaultConfiguration: !prev.defaultConfiguration }))}><span className="switch-toggle__thumb" /></button>
            </div>
            
            <div className={`accordion-wrapper ${newSector.defaultConfiguration ? 'expanded' : ''}`}>
              <div className="accordion-content">
                <div style={{ display: 'flex', gap: '12px', paddingTop: '16px' }}>
                  <div className="input-group" style={{ flex: 1, marginBottom: 0 }}><label>Hora</label><input type="time" value={newConfiguration.startTime} onChange={e => setNewConfiguration({...newConfiguration, startTime: e.target.value})} required={newSector.defaultConfiguration} /></div>
                  <div className="input-group" style={{ flex: 1, marginBottom: 0 }}><label>Min</label><input type="number" min="5" value={newConfiguration.durationMinutes} onChange={e => setNewConfiguration({...newConfiguration, durationMinutes: e.target.value})} required={newSector.defaultConfiguration} /></div>
                </div>
              </div>
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop: '20px' }}>{newSector.defaultConfiguration ? 'Crear sector y rutina' : 'Crear sector'}</button>
          </form>
        </div>
      )}
    </div>
  );
}