import React, { useState, useEffect, useRef } from 'react';

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
  
  const MAX_ROUTINES = 6;
  const [routineList, setRoutineList] = useState([
    { id: Date.now(), startTime: '', durationMinutes: 15, errorTime: '', errorDuration: '' }
  ]);
  const [removingRowIds, setRemovingRowIds] = useState([]);
  const [isAtLimitShake, setIsAtLimitShake] = useState(false);

  const [sectorNameError, setSectorNameError] = useState('');

  const [editingRoutineId, setEditingRoutineId] = useState(null);
  const [editData, setEditData] = useState({ startTime: '', durationMinutes: 15 });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingIds, setDeletingIds] = useState([]);

  // REFERENCIAS Y BANDERA DE INMUNIDAD PARA EL AUTO-SCROLL FLUIDO
  const routineRefs = useRef({});
  const scrollContainerRef = useRef(null);
  const isProgrammaticScroll = useRef(false); // <--- ESCUDO ANTI-CONFLICTO CON EL REBOTE
  
  const [scrollShadows, setScrollShadows] = useState({ top: false, bottom: false });
  const [edgeBounce, setEdgeBounce] = useState('');

  useEffect(() => {
    if (selectedTab !== 'NEW' && !sectors.find(s => s.id === selectedTab)) {
      handleSetTab(sectors[0]?.id || 'NEW');
    }
  }, [sectors, selectedTab]);

  useEffect(() => {
    cancelEditing();
    setSectorNameError('');
  }, [selectedTab]);

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

  const checkScrollShadows = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    
    const { scrollTop, scrollHeight, clientHeight } = el;
    const isAtTop = scrollTop <= 2;
    const isAtBottom = scrollHeight - scrollTop - clientHeight <= 2;
    const hasScroll = scrollHeight > clientHeight;

    setScrollShadows({
      top: !isAtTop && hasScroll,
      bottom: !isAtBottom && hasScroll
    });
  };

  useEffect(() => {
    checkScrollShadows();
    const timer = setTimeout(checkScrollShadows, 350);
    return () => clearTimeout(timer);
  }, [selectedTab, sortedConfigs.length, editingRoutineId]);

  // SENSOR DE SCROLL BLINDADO: Si el scroll es automático, ignoramos el rebote en los topes
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isAtTop = scrollTop <= 2;
    const isAtBottom = scrollHeight - scrollTop - clientHeight <= 2;
    const hasScroll = scrollHeight > clientHeight;

    setScrollShadows({
      top: !isAtTop && hasScroll,
      bottom: !isAtBottom && hasScroll
    });

    // Si la app está moviendo el scroll por ti, no dispares el rebote visual
    if (isProgrammaticScroll.current) return;

    if (isAtTop && scrollTop === 0 && edgeBounce !== 'top' && hasScroll) {
      setEdgeBounce('top');
      setTimeout(() => setEdgeBounce(''), 300);
    } else if (isAtBottom && edgeBounce !== 'bottom' && hasScroll) {
      setEdgeBounce('bottom');
      setTimeout(() => setEdgeBounce(''), 300);
    }
  };

  const handleAddRoutineRow = () => {
    if (routineList.length >= MAX_ROUTINES) {
      setIsAtLimitShake(true);
      setTimeout(() => setIsAtLimitShake(false), 450);
      return;
    }
    setRoutineList(prev => [
      ...prev, 
      { id: Date.now(), startTime: '', durationMinutes: 15, errorTime: '', errorDuration: '' }
    ]);
  };

  const handleRemoveRoutineRow = (idToRemove) => {
    if (routineList.length === 1) return; 
    
    setRemovingRowIds(prev => [...prev, idToRemove]);
    
    setTimeout(() => {
      setRoutineList(prev => prev.filter(r => r.id !== idToRemove));
      setRemovingRowIds(prev => prev.filter(id => id !== idToRemove));
    }, 420);
  };

  const handleChangeRoutineRow = (id, field, value) => {
    setRoutineList(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value };
      if (field === 'startTime') updated.errorTime = '';
      if (field === 'durationMinutes') updated.errorDuration = '';
      return updated;
    }));
  };

  const onSaveBatchConfig = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    setLocalError('');

    let hasErrors = false;
    const seenTimes = new Set();

    const validatedList = routineList.map(r => {
      let errTime = '';
      let errDur = '';

      if (!r.startTime) {
        errTime = 'Elige una hora';
        hasErrors = true;
      } else {
        const isDuplicateExisting = sectorConfigs.some(c => formatTime(c.startTime) === r.startTime);
        const isDuplicateBatch = seenTimes.has(r.startTime);

        if (isDuplicateExisting || isDuplicateBatch) {
          errTime = 'Horario repetido';
          hasErrors = true;
        } else {
          seenTimes.add(r.startTime);
        }
      }

      const dur = Number(r.durationMinutes);
      if (!r.durationMinutes || dur < 5 || dur > 180) {
        errDur = 'Mín. 5 - Máx. 180 min';
        hasErrors = true;
      }

      return { ...r, errorTime: errTime, errorDuration: errDur };
    });

    if (hasErrors) {
      setRoutineList(validatedList);
      return;
    }

    const payload = validatedList.map(r => ({
      sectorId: selectedTab,
      startTime: r.startTime,
      durationMinutes: Number(r.durationMinutes),
      enabled: true
    }));

    setIsSaving(true);
    try {
      await handleSaveConfigurationsBatch(payload);
      setRoutineList([{ id: Date.now(), startTime: '', durationMinutes: 15, errorTime: '', errorDuration: '' }]);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateSectorSubmit = async (e) => {
    e.preventDefault();
    if (!newSector.name || !newSector.name.trim()) {
      setSectorNameError('Ingresa un nombre para el sector');
      return;
    }
    setSectorNameError('');

    await handleCreateSector(e, { 
      defaultConfiguration: newSector.defaultConfiguration, 
      createConfiguration: newSector.defaultConfiguration 
    });
    
    handleSetTab(sectors[0]?.id || 'NEW');
  };

  // AUTO-SCROLL COREOGRAFIADO CON ESCUDO DE INMUNIDAD ACTIVO
  const startEditing = (routine) => {
    setLocalError('');
    setConfirmDeleteId(null); 
    setEditingRoutineId(routine.id);
    setEditData({
      startTime: formatTime(routine.startTime),
      durationMinutes: routine.durationMinutes
    });

    // Activamos el escudo para que el rebote no interfiera con el centrado del primero/último
    isProgrammaticScroll.current = true;

    setTimeout(() => {
      const element = routineRefs.current[routine.id];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      // Apagamos el escudo medio segundo después de que termine la animación
      setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 500);
    }, 160);
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
      
      {/* ESTILOS BLINDADOS: Movimiento fluido + Cero conflictos en topes + Tu tiempo de 0.60s */}
      <style>{`
        .led-wrapper {
          width: 16px;
          min-width: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .led-ring {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          transition: all 0.25s ease;
          box-sizing: border-box;
        }
        .led-ring.active {
          background: var(--primary);
          border: none;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
        }
        .led-ring.paused {
          background: transparent;
          border: 1.5px solid var(--text-muted);
          opacity: 0.6;
        }

        .btn-fixed-new {
          flex-shrink: 0 !important;
          border: 1.5px dashed rgba(255, 255, 255, 0.35) !important;
          background: rgba(255, 255, 255, 0.07) !important;
          color: var(--text-main) !important;
          transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1) !important;
        }
        .btn-fixed-new:hover, .btn-fixed-new.active {
          border: 1.5px solid var(--primary) !important;
          background: rgba(16, 185, 129, 0.15) !important;
          color: var(--primary) !important;
        }

        .chip {
          flex-shrink: 0;
          max-width: 180px;
        }
        .chip-text {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: inline-block;
          vertical-align: middle;
        }

        .card-title-shield {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          word-break: break-word;
          overflow-wrap: anywhere;
          font-size: 1.4rem;
          color: var(--text-main);
          font-weight: 700;
          line-height: 1.25;
        }

        .flex-shrink-zero {
          flex-shrink: 0 !important;
        }

        .interactive-card {
          cursor: pointer;
          transition: transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1), background 0.15s ease, border-color 0.15s ease;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }
        .interactive-card:active {
          transform: scale(0.98) !important;
        }

        /* TRANSICIÓN DE 0.60s CONSERVADA */
        .sector-content-transition {
          animation: slideFadeIn 0.60s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        @keyframes slideFadeIn {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .scroll-shadow-wrapper {
          position: relative;
          border-radius: 16px;
          transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .scroll-shadow-wrapper.bounce-top {
          transform: translateY(4px);
        }
        .scroll-shadow-wrapper.bounce-bottom {
          transform: translateY(-4px);
        }
        .scroll-shadow-wrapper::before, .scroll-shadow-wrapper::after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          height: 14px;
          pointer-events: none;
          z-index: 2;
          transition: opacity 0.25s ease;
        }
        .scroll-shadow-wrapper::before {
          top: 0;
          background: linear-gradient(to bottom, rgba(0,0,0,0.18), transparent);
          opacity: 0;
        }
        .scroll-shadow-wrapper::after {
          bottom: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.18), transparent);
          opacity: 0;
        }
        .scroll-shadow-wrapper.show-top::before { opacity: 1; }
        .scroll-shadow-wrapper.show-bottom::after { opacity: 1; }

        .routines-scroll-area {
          max-height: 350px;
          overflow-y: auto;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 2px 4px 2px 2px;
        }
        .routines-scroll-area::-webkit-scrollbar {
          width: 5px;
        }
        .routines-scroll-area::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .routines-scroll-area::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 10px;
        }
        .routines-scroll-area::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .accordion-wrapper {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease;
          opacity: 0;
          overflow: hidden;
        }
        .accordion-wrapper.expanded {
          grid-template-rows: 1fr;
          opacity: 1;
        }
        .accordion-content {
          min-height: 0;
          overflow: hidden;
        }

        .input-error {
          border-color: #ef4444 !important;
          background: rgba(239, 68, 68, 0.06) !important;
        }
        .error-message-wrapper {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease;
          opacity: 0;
          overflow: hidden;
        }
        .error-message-wrapper.show {
          grid-template-rows: 1fr;
          opacity: 1;
        }
        .error-message-content {
          min-height: 0;
          overflow: hidden;
        }

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

        .limit-shake {
          animation: shakeNoNo 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97) both !important;
          border-color: #ef4444 !important;
          color: #ef4444 !important;
          background: rgba(239, 68, 68, 0.15) !important;
        }
        @keyframes shakeNoNo {
          0%, 100% { transform: translateX(0) scale(1); }
          15%, 45%, 75% { transform: translateX(-5px) scale(0.92); }
          30%, 60%, 90% { transform: translateX(5px) scale(0.92); }
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
          flex-direction: column;
          gap: 4px;
          overflow: hidden;
          transform-origin: top;
        }
        .row-enter {
          animation: slideIn 0.35s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        .row-exit {
          animation: smoothRowDelete 0.42s cubic-bezier(0.2, 0.8, 0.2, 1) forwards !important;
          pointer-events: none;
        }

        @keyframes slideIn {
          0% { opacity: 0; max-height: 0; margin-bottom: 0; transform: translateY(-10px) scaleY(0.8); }
          100% { opacity: 1; max-height: 140px; margin-bottom: 12px; transform: translateY(0) scaleY(1); }
        }
        
        @keyframes smoothRowDelete {
          0% { opacity: 1; max-height: 100px; margin-bottom: 8px; transform: scale(1); }
          35% { opacity: 0; transform: scale(0.95) translateY(-2px); }
          100% { opacity: 0; max-height: 0; margin-bottom: 0; transform: scale(0.9) translateY(-8px); }
        }
      `}</style>

      {/* === CABECERA DE SECTORES === */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 4px' }}>
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
            {sectors.map(sector => {
              const isEnabled = sector.enabled !== false;
              const isSelected = selectedTab === sector.id;
              return (
                <button 
                  key={sector.id} 
                  className={`chip ${isSelected ? 'active' : ''}`} 
                  onClick={() => handleSetTab(sector.id)} 
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  title={sector.name}
                >
                  <span className="led-wrapper">
                    <span className={`led-ring ${isEnabled ? 'active' : 'paused'}`}></span>
                  </span>
                  <span className="chip-text">{sector.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* CONTENEDOR CON TRANSICIÓN SUAVE */}
      {selectedTab !== 'NEW' && selectedSectorObj && (
        <div key={selectedTab} className="sector-content-transition">
          
          {/* TARJETA PRINCIPAL INTERACTIVA Y BLINDADA */}
          <div 
            className="glass-panel interactive-card" 
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '84px', gap: '16px' }}
            onClick={() => handleToggleSector(selectedSectorObj)}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 className="card-title-shield" title={selectedSectorObj.name}>
                {selectedSectorObj.name}
              </h3>
              <p className="text-muted" style={{ fontSize: '0.95rem', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selectedSectorObj.description || 'Sin descripción'}
              </p>
            </div>
            
            <div className="flex-shrink-zero">
              {(() => {
                const isSectorEnabled = selectedSectorObj.enabled !== false;
                return (
                  <div style={{
                    minWidth: '115px', 
                    padding: '8px 14px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    letterSpacing: '0.5px',
                    border: `1px solid ${isSectorEnabled ? 'var(--primary)' : 'var(--surface-border)'}`,
                    background: isSectorEnabled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                    color: isSectorEnabled ? 'var(--primary)' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}>
                    <span className={`led-ring ${isSectorEnabled ? 'active' : 'paused'}`}></span>
                    <span>{isSectorEnabled ? 'ACTIVO' : 'PAUSADO'}</span>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* === RUTINAS PROGRAMADAS CON CONTADOR Y SCROLL PROTEGIDO === */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 4px' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Rutinas Programadas {sortedConfigs.length > 0 && <span style={{ color: 'var(--primary)', fontWeight: '800' }}>({sortedConfigs.length})</span>}
              </span>
              
              {sortedConfigs.length > 0 && typeof handleToggleAllConfigurations === 'function' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    type="button"
                    className="btn-icon-action"
                    onClick={(e) => { e.stopPropagation(); handleToggleAllConfigurations(selectedTab, true); }} 
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
                    onClick={(e) => { e.stopPropagation(); handleToggleAllConfigurations(selectedTab, false); }} 
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
                <div className={`scroll-shadow-wrapper ${scrollShadows.top ? 'show-top' : ''} ${scrollShadows.bottom ? 'show-bottom' : ''} ${edgeBounce === 'top' ? 'bounce-top' : ''} ${edgeBounce === 'bottom' ? 'bounce-bottom' : ''}`}>
                  <div 
                    ref={scrollContainerRef}
                    className="routines-scroll-area"
                    onScroll={handleScroll}
                  >
                    {sortedConfigs.map((c) => {
                      const isEditing = editingRoutineId === c.id;
                      const isDeleting = deletingIds.includes(c.id);
                      
                      return (
                        <div 
                          key={c.id} 
                          ref={el => routineRefs.current[c.id] = el}
                          className={`list-item-enter ${isEditing ? 'editing-card' : ''} ${isDeleting ? 'list-item-exit' : ''}`} 
                          style={{ 
                            background: isEditing ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '16px',
                            opacity: c.enabled || isEditing ? 1 : 0.5, borderLeft: `4px solid ${c.enabled ? 'var(--primary)' : 'var(--text-muted)'}`,
                            transition: 'all 0.3s ease', cursor: isEditing ? 'default' : 'pointer', flexShrink: 0
                          }}
                          onClick={() => { if (!isEditing && !isDeleting) startEditing(c); }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
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
                </div>
              )}
            </div>
          </div>

          {/* === NUEVAS RUTINAS (CON LÍMITE DE 6 Y REBOTE ELÁSTICO) === */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 4px' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Nuevas Rutinas
              </span>
              
              <button 
                type="button"
                onClick={handleAddRoutineRow}
                className={`btn-icon-action ${isAtLimitShake ? 'limit-shake' : ''}`}
                title="Añadir otro horario (Máx. 6)"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            </div>

            <div className="glass-panel" style={{ padding: '16px' }}>
              {localError && !editingRoutineId && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>{localError}</div>}
              
              <form onSubmit={onSaveBatchConfig} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                
                {routineList.map((routine, index) => {
                  const isRemoving = removingRowIds.includes(routine.id);
                  
                  return (
                    <div 
                      key={routine.id} 
                      className={`animated-row ${isRemoving ? 'row-exit' : 'row-enter'}`} 
                    >
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                        
                        <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                          {index === 0 && <label style={{ fontSize: '0.8rem', marginBottom: '4px' }}>Hora</label>}
                          <input 
                            type="time" 
                            value={routine.startTime} 
                            onChange={e => handleChangeRoutineRow(routine.id, 'startTime', e.target.value)} 
                            className={routine.errorTime ? 'input-error' : ''}
                            style={{ transition: 'border-color 0.2s ease, background 0.2s ease' }}
                          />
                        </div>
                        
                        <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                          {index === 0 && <label style={{ fontSize: '0.8rem', marginBottom: '4px' }}>Min</label>}
                          <input 
                            type="number" min="5" max="180" 
                            value={routine.durationMinutes} 
                            onChange={e => handleChangeRoutineRow(routine.id, 'durationMinutes', e.target.value)} 
                            className={routine.errorDuration ? 'input-error' : ''}
                            style={{ transition: 'border-color 0.2s ease, background 0.2s ease' }}
                          />
                        </div>

                        {routineList.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => handleRemoveRoutineRow(routine.id)}
                            style={{ height: '42px', width: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'none', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s ease', flexShrink: 0 }}
                            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.85)'}
                            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            title="Eliminar fila"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        
                        <div style={{ flex: 1 }}>
                          <div className={`error-message-wrapper ${routine.errorTime ? 'show' : ''}`}>
                            <div className="error-message-content">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', fontWeight: '600' }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <line x1="12" y1="8" x2="12" y2="12"></line>
                                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                </svg>
                                <span>{routine.errorTime}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div style={{ flex: 1 }}>
                          <div className={`error-message-wrapper ${routine.errorDuration ? 'show' : ''}`}>
                            <div className="error-message-content">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', fontWeight: '600' }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <line x1="12" y1="8" x2="12" y2="12"></line>
                                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                </svg>
                                <span>{routine.errorDuration}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {routineList.length > 1 && <div style={{ width: '42px', flexShrink: 0 }} />}
                      </div>

                    </div>
                  );
                })}

                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ padding: '14px', marginTop: '8px', opacity: isSaving ? 0.7 : 1, fontSize: '1rem' }} 
                  disabled={isSaving}
                >
                  {isSaving ? 'Guardando...' : `Guardar ${routineList.length > 1 ? routineList.length + ' rutinas' : 'rutina'}`}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* === CREAR SECTOR (BLINDADO CON VALIDACIÓN FLUIDA Y SIN SALIDAS BRUSCAS) === */}
      {selectedTab === 'NEW' && (
        <div className="glass-panel sector-content-transition">
          <h3 style={{ fontSize: '1.4rem', marginBottom: '6px', fontWeight: '700' }}>Crear Sector</h3>
          <p className="text-muted" style={{ fontSize: '0.95rem', marginBottom: '20px' }}>Agrega una nueva zona de riego</p>
          
          <form onSubmit={handleCreateSectorSubmit}>
            <div className="input-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.85rem' }}>Nombre del sector</label>
              <input 
                type="text" 
                value={newSector.name} 
                onChange={e => {
                  setNewSector({...newSector, name: e.target.value});
                  if (sectorNameError) setSectorNameError('');
                }} 
                placeholder="Ej. Patio trasero" 
                className={sectorNameError ? 'input-error' : ''}
                style={{ transition: 'border-color 0.2s ease, background 0.2s ease' }}
              />
              
              <div className={`error-message-wrapper ${sectorNameError ? 'show' : ''}`}>
                <div className="error-message-content">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', fontWeight: '600' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>{sectorNameError}</span>
                  </div>
                </div>
              </div>
            </div>

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