import React, { useState, useEffect } from 'react';

export default function ConfigView({ appData }) {
  const { 
    sectors, configurations, handleToggleSector, handleSaveConfigurationsBatch, 
    handleCreateSector, newSector, setNewSector,
    handleToggleConfiguration, handleDeleteConfiguration,
    newConfiguration, setNewConfiguration,
    handleUpdateRoutine,
    lastSectorId, setLastSectorId, handleToggleAllSectors,
    handleToggleAllConfigurations
  } = appData;

  const [localTab, setLocalTab] = useState(sectors[0]?.id || 'NEW');
  const selectedTab = lastSectorId || localTab;

  const handleSetTab = (id) => {
    if (setLastSectorId) setLastSectorId(id);
    setLocalTab(id);
  };

  const [localError, setLocalError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const [routineList, setRoutineList] = useState([{ id: Date.now(), startTime: '', durationMinutes: 15 }]);
  const [removingRowIds, setRemovingRowIds] = useState([]);

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

  // CORRECCIÓN PUNTO 3: Eliminamos por completo el useEffect de "clic afuera".
  // Ahora la edición NUNCA se cerrará sola al tocar el selector de hora del sistema operativo.
  // Solo se cierra si tú decides tocar "Guardar", "Eliminar" o el botón "✕".

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

  const handleAddRoutineRow = () => {
    setRoutineList(prev => [...prev, { id: Date.now(), startTime: '', durationMinutes: 15 }]);
  };

  const handleRemoveRoutineRow = (idToRemove) => {
    if (routineList.length === 1) return; 
    
    setRemovingRowIds(prev => [...prev, idToRemove]);
    
    setTimeout(() => {
      setRoutineList(prev => prev.filter(r => r.id !== idToRemove));
      setRemovingRowIds(prev => prev.filter(id => id !== idToRemove));
    }, 460);
  };

  const handleChangeRoutineRow = (id, field, value) => {
    setRoutineList(prev => prev.map(r => 
      r.id === id ? { ...r, [field]: value } : r
    ));
  };

  const onSaveBatchConfig = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    setLocalError('');

    if (routineList.some(r => !r.startTime)) {
      setLocalError('Por favor, completa todas las horas.');
      return;
    }

    const duplicateError = routineList.find(newRoutine => 
      sectorConfigs.some(existingConfig => formatTime(existingConfig.startTime) === newRoutine.startTime)
    );

    if (duplicateError) {
      setLocalError(`Ya existe una rutina programada a las ${duplicateError.startTime}.`);
      return;
    }

    const payload = routineList.map(r => ({
      sectorId: selectedTab,
      startTime: r.startTime,
      durationMinutes: Number(r.durationMinutes),
      enabled: true
    }));

    setIsSaving(true);
    try {
      await handleSaveConfigurationsBatch(payload);
      setRoutineList([{ id: Date.now(), startTime: '', durationMinutes: 15 }]);
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
      
      {/* ESTILOS BLINDADOS */}
      <style>{`
        /* BOTONES MINIMALISTAS DE ÍCONO (Compartidos para Sectores y Rutinas) */
        .btn-icon-action {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          cursor: pointer;
          border: 1px solid var(--surface-border);
          background: rgba(255, 255, 255, 0.03);
          color: var(--text-muted);
          transition: all 0.15s cubic-bezier(0.2, 0.8, 0.2, 1);
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }
        .btn-icon-action:hover {
          color: var(--text-main);
          border-color: var(--text-muted);
        }
        .btn-icon-action:active {
          transform: scale(0.85) !important;
          background: rgba(255, 255, 255, 0.15) !important;
          color: var(--primary) !important;
          border-color: var(--primary) !important;
        }
        
        .btn-add-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid var(--primary);
          background: transparent;
          color: var(--primary);
          transition: transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1), background 0.15s ease;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }
        .btn-add-pill:active {
          transform: scale(0.88) !important;
          background: var(--primary) !important;
          color: #fff !important;
        }
        
        .list-item-exit {
          animation: smoothCollapseOut 0.48s cubic-bezier(0.4, 0, 0.2, 1) forwards !important;
          pointer-events: none;
        }
        @keyframes smoothCollapseOut {
          0% { opacity: 1; max-height: 150px; margin-bottom: 10px; transform: scale(1); }
          40% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 0; max-height: 0; margin-bottom: 0; padding-top: 0; padding-bottom: 0; border: none; transform: scale(0.9); }
        }

        .animated-row {
          display: flex;
          gap: 8px;
          align-items: flex-end;
          overflow: hidden;
          transform-origin: top;
        }
        .row-enter {
          animation: slideIn 0.35s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        .row-exit {
          animation: slideOut 0.48s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        @keyframes slideIn {
          0% { opacity: 0; max-height: 0; margin-bottom: 0; transform: translateY(-10px) scaleY(0.8); }
          100% { opacity: 1; max-height: 85px; margin-bottom: 12px; transform: translateY(0) scaleY(1); }
        }
        @keyframes slideOut {
          0% { opacity: 1; max-height: 85px; margin-bottom: 12px; transform: translateY(0) scaleY(1); }
          40% { opacity: 0; transform: translateY(-5px) scaleY(0.95); }
          100% { opacity: 0; max-height: 0; margin-bottom: 0; transform: translateY(-10px) scaleY(0.8); }
        }
      `}</style>

      {/* === CABECERA DE SECTORES (Con botones circulares idénticos a Rutinas) === */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 4px' }}>
          {/* TÍTULO ENGRANDECIDO: 1.05rem */}
          <span style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Mis Sectores
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              type="button"
              className="btn-icon-action"
              onClick={() => handleToggleAllSectors(true)} 
              title="Habilitar todos los sectores"
            >
              {/* ÍCONO DOBLE CHECK */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L7 17l-5-5"></path>
                <path d="m22 10-7.5 7.5L13 16"></path>
              </svg>
            </button>
            <button 
              type="button"
              className="btn-icon-action"
              onClick={() => handleToggleAllSectors(false)} 
              title="Pausar todos los sectores"
            >
              {/* ÍCONO CÍRCULO TACHADO */}
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
              </svg>
            </button>
          </div>
        </div>

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
            {sectors.filter(s => s.enabled).map(sector => (
              <button key={sector.id} className={`chip ${selectedTab === sector.id ? 'active' : ''}`} onClick={() => handleSetTab(sector.id)} style={{ display: 'flex', alignItems: 'center' }}>
                <span className="icon-active-dot"></span>{sector.name}
              </button>
            ))}
            
            {sectors.filter(s => !s.enabled).map(sector => (
              <button key={sector.id} className={`chip ${selectedTab === sector.id ? 'active' : ''}`} onClick={() => handleSetTab(sector.id)} style={{ display: 'flex', alignItems: 'center', opacity: selectedTab === sector.id ? 1 : 0.6 }}>
                <svg className="icon-paused" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" rx="1"></rect><rect x="14" y="4" width="4" height="16" rx="1"></rect></svg>
                {sector.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedTab !== 'NEW' && selectedSectorObj && (
        <>
          <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              {/* TÍTULO DE SECTOR ENGRANDECIDO: 1.4rem */}
              <h3 style={{ fontSize: '1.4rem', color: 'var(--text-main)', fontWeight: '700' }}>{selectedSectorObj.name}</h3>
              <p className="text-muted" style={{ fontSize: '0.95rem', marginTop: '4px' }}>
                {selectedSectorObj.description || 'Sin descripción'}
              </p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              {(() => {
                const isSectorEnabled = selectedSectorObj.enabled !== false;
                return (
                  <>
                    <button type="button" className={`switch-toggle ${isSectorEnabled ? 'is-on' : 'is-off'}`} onClick={() => handleToggleSector(selectedSectorObj)}>
                      <span className="switch-toggle__thumb" />
                    </button>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: isSectorEnabled ? 'var(--primary)' : 'var(--text-muted)' }}>
                        {isSectorEnabled ? 'HABILITADO' : 'DESHABILITADO'}
                      </div>
                      {!isSectorEnabled && (
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px', opacity: 0.8 }}>
                          (Rutinas pausadas)
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* === RUTINAS PROGRAMADAS === */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 4px' }}>
              {/* TÍTULO ENGRANDECIDO: 1.05rem */}
              <span style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Rutinas Programadas
              </span>
              
              {sortedConfigs.length > 0 && typeof handleToggleAllConfigurations === 'function' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    type="button"
                    className="btn-icon-action"
                    onClick={() => handleToggleAllConfigurations(selectedTab, true)} 
                    title="Activar todas las rutinas"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6L7 17l-5-5"></path>
                      <path d="m22 10-7.5 7.5L13 16"></path>
                    </svg>
                  </button>

                  <button 
                    type="button"
                    className="btn-icon-action"
                    onClick={() => handleToggleAllConfigurations(selectedTab, false)} 
                    title="Pausar todas las rutinas"
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                    </svg>
                  </button>
                </div>
              )}
            </div>
            
            <div className="glass-panel" style={{ padding: '16px' }}>
              {sortedConfigs.length === 0 ? (
                <p className="text-muted" style={{ fontSize: '0.95rem', textAlign: 'center', padding: '20px 10px' }}>No tienes ninguna rutina programada.</p>
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
                            {/* HORA DE RUTINA ENGRANDECIDA: 1.45rem */}
                            <h4 style={{ fontSize: '1.45rem', fontWeight: '700', color: c.enabled ? 'var(--text-main)' : 'var(--text-muted)' }}>
                              {formatTime(c.startTime)}
                            </h4>
                            <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '2px', opacity: c.enabled ? 1 : 0.4 }}>
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
                                <div className="input-group" style={{ flex: 1, marginBottom: 0 }}><label style={{ fontSize: '0.85rem' }}>Hora</label><input type="time" value={editData.startTime} onChange={e => setEditData({...editData, startTime: e.target.value})} required /></div>
                                <div className="input-group" style={{ flex: 1, marginBottom: 0 }}><label style={{ fontSize: '0.85rem' }}>Minutos</label><input type="number" min="5" max="180" value={editData.durationMinutes} onChange={e => setEditData({...editData, durationMinutes: e.target.value})} required /></div>
                              </div>
                              
                              {localError && <div style={{ color: '#fca5a5', fontSize: '0.85rem' }}>{localError}</div>}
                              
                              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '12px', fontSize: '0.95rem', margin: 0 }}>Guardar</button>
                                <button 
                                  type="button" 
                                  onClick={(e) => { 
                                    e.stopPropagation();
                                    if (confirmDeleteId === c.id) {
                                      setDeletingIds(prev => [...prev, c.id]);
                                      setTimeout(() => { handleDeleteConfiguration(c.id); }, 480);
                                    } else {
                                      setConfirmDeleteId(c.id);
                                    }
                                  }} 
                                  style={{ 
                                    flex: 1, padding: '12px', fontSize: '0.95rem', fontWeight: 'bold', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s ease',
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
          </div>

          {/* === CREADOR MÚLTIPLE DE RUTINAS === */}
          <div className="glass-panel" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              {/* TÍTULO ENGRANDECIDO: 1.25rem */}
              <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', fontWeight: '700' }}>Añadir Rutinas</h3>
              
              <button 
                type="button"
                onClick={handleAddRoutineRow}
                className="btn-add-pill"
                title="Añadir otro horario"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Añadir
              </button>
            </div>

            {localError && !editingRoutineId && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>{localError}</div>}
            
            <form onSubmit={onSaveBatchConfig} style={{ display: 'flex', flexDirection: 'column' }}>
              
              {routineList.map((routine, index) => {
                const isRemoving = removingRowIds.includes(routine.id);
                
                return (
                  <div 
                    key={routine.id} 
                    className={`animated-row ${isRemoving ? 'row-exit' : 'row-enter'}`} 
                  >
                    <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                      {index === 0 && <label style={{ fontSize: '0.8rem', marginBottom: '4px' }}>Hora</label>}
                      <input 
                        type="time" 
                        value={routine.startTime} 
                        onChange={e => handleChangeRoutineRow(routine.id, 'startTime', e.target.value)} 
                        required 
                      />
                    </div>
                    
                    <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                      {index === 0 && <label style={{ fontSize: '0.8rem', marginBottom: '4px' }}>Min</label>}
                      <input 
                        type="number" min="5" max="180" 
                        value={routine.durationMinutes} 
                        onChange={e => handleChangeRoutineRow(routine.id, 'durationMinutes', e.target.value)} 
                        required 
                      />
                    </div>

                    {routineList.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => handleRemoveRoutineRow(routine.id)}
                        style={{ height: '42px', width: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'none', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.85)'}
                        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        title="Eliminar fila"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}

              <button 
                type="submit" 
                className="btn-primary" 
                style={{ padding: '14px', marginTop: '4px', opacity: isSaving ? 0.7 : 1, fontSize: '1rem' }} 
                disabled={isSaving}
              >
                {isSaving ? 'Guardando...' : `Guardar ${routineList.length > 1 ? routineList.length + ' rutinas' : 'rutina'}`}
              </button>
            </form>
          </div>
        </>
      )}

      {selectedTab === 'NEW' && (
        <div className="glass-panel">
          {/* TÍTULOS ENGRANDECIDOS */}
          <h3 style={{ fontSize: '1.4rem', marginBottom: '6px', fontWeight: '700' }}>Crear Sector</h3>
          <p className="text-muted" style={{ fontSize: '0.95rem', marginBottom: '20px' }}>Agrega una nueva zona de riego</p>
          <form onSubmit={(e) => { handleCreateSector(e, { defaultConfiguration: newSector.defaultConfiguration, createConfiguration: newSector.defaultConfiguration }); handleSetTab(sectors[0]?.id || 'NEW'); }}>
            <div className="input-group"><label style={{ fontSize: '0.85rem' }}>Nombre del sector</label><input type="text" value={newSector.name} onChange={e => setNewSector({...newSector, name: e.target.value})} placeholder="Ej. Patio trasero" /></div>
            <div className="input-group"><label style={{ fontSize: '0.85rem' }}>Descripción</label><input type="text" value={newSector.description} onChange={e => setNewSector({...newSector, description: e.target.value})} placeholder="Ej. Zona de macetas" /></div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0 0 0', borderTop: '1px solid var(--surface-border)', paddingTop: '16px' }}>
              <div><p style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '1rem' }}>Añadir rutina inicial</p></div>
              <button type="button" className={`switch-toggle ${newSector.defaultConfiguration ? 'is-on' : 'is-off'}`} onClick={() => setNewSector(prev => ({ ...prev, defaultConfiguration: !prev.defaultConfiguration }))}><span className="switch-toggle__thumb" /></button>
            </div>
            
            <div className={`accordion-wrapper ${newSector.defaultConfiguration ? 'expanded' : ''}`}>
              <div className="accordion-content">
                <div style={{ display: 'flex', gap: '12px', paddingTop: '16px' }}>
                  <div className="input-group" style={{ flex: 1, marginBottom: 0 }}><label style={{ fontSize: '0.85rem' }}>Hora</label><input type="time" value={newConfiguration.startTime} onChange={e => setNewConfiguration({...newConfiguration, startTime: e.target.value})} required={newSector.defaultConfiguration} /></div>
                  <div className="input-group" style={{ flex: 1, marginBottom: 0 }}><label style={{ fontSize: '0.85rem' }}>Min</label><input type="number" min="5" value={newConfiguration.durationMinutes} onChange={e => setNewConfiguration({...newConfiguration, durationMinutes: e.target.value})} required={newSector.defaultConfiguration} /></div>
                </div>
              </div>
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop: '20px', fontSize: '1rem' }}>{newSector.defaultConfiguration ? 'Crear sector y rutina' : 'Crear sector'}</button>
          </form>
        </div>
      )}
    </div>
  );
}