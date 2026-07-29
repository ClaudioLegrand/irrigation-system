import React, { useState, useEffect, useRef } from 'react';

export default function ConfigView({ appData }) {
  const { 
    sectors, configurations, handleToggleSector, handleSaveConfigurationsBatch, 
    handleCreateSector, newSector, setNewSector,
    handleToggleConfiguration, handleDeleteConfiguration,
    newConfiguration, setNewConfiguration,
    handleUpdateRoutine, handleUpdateSector,
    lastSectorId, setLastSectorId, handleToggleAllSectors,
    handleToggleAllConfigurations,
    handleDeleteSector // <-- Añadimos esto aquí
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
  
  // NUEVO: Estado para editar el nombre del sector fluidamente
  const [isEditingSectorName, setIsEditingSectorName] = useState(false);
  const [editedSectorName, setEditedSectorName] = useState('');

  // NUEVO: Estado para el borrado del sector
  const [confirmDeleteSectorId, setConfirmDeleteSectorId] = useState(null);

  const routineRefs = useRef({});
  const isProgrammaticScroll = useRef(false);

  const [scrollShadowsTabs, setScrollShadowsTabs] = useState({ left: false, right: false });
  const tabsScrollRef = useRef(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);

  useEffect(() => {
    if (selectedTab !== 'NEW' && !sectors.find(s => s.id === selectedTab)) {
      handleSetTab(sectors[0]?.id || 'NEW');
    }
  }, [sectors, selectedTab]);

  useEffect(() => {
    cancelEditing();
    setSectorNameError('');
    setIsEditingSectorName(false);
    setConfirmDeleteSectorId(null); // Resetea el botón de borrar al cambiar de pestaña
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

  const checkHorizontalScrollTabs = () => {
    const el = tabsScrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const hasScroll = scrollWidth > clientWidth;
    const isAtLeft = scrollLeft <= 2;
    const isAtRight = scrollWidth - scrollLeft - clientWidth <= 2;
    setScrollShadowsTabs({
      left: !isAtLeft && hasScroll,
      right: !isAtRight && hasScroll
    });
  };

  useEffect(() => {
    checkHorizontalScrollTabs();
    const timer = setTimeout(checkHorizontalScrollTabs, 350);
    return () => clearTimeout(timer);
  }, [sectors]);

  const handleHorizontalScrollTabs = (e) => {
    const { scrollLeft, scrollWidth, clientWidth } = e.currentTarget;
    const hasScroll = scrollWidth > clientWidth;
    setScrollShadowsTabs({
      left: scrollLeft > 2 && hasScroll,
      right: scrollWidth - scrollLeft - clientWidth > 2 && hasScroll
    });
  };

  const handleTouchStartTabs = (e) => {
    isDraggingRef.current = false;
    const touch = e.touches ? e.touches[0] : e;
    startXRef.current = touch.clientX;
    startYRef.current = touch.clientY;
  };

  const handleTouchMoveTabs = (e) => {
    const touch = e.touches ? e.touches[0] : e;
    const diffX = Math.abs(touch.clientX - startXRef.current);
    const diffY = Math.abs(touch.clientY - startYRef.current);
    if (diffX > 4 && diffX > diffY) {
      isDraggingRef.current = true;
      if (e.stopPropagation) e.stopPropagation();
    }
  };

  const handleTabClick = (id) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      return; 
    }
    handleSetTab(id);
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

  const handleSaveSectorName = async (e) => {
    if (e) e.stopPropagation();
    if (!editedSectorName.trim()) return;
    
    if (handleUpdateSector) {
      await handleUpdateSector(selectedTab, { name: editedSectorName });
    } else {
      console.warn("La función handleUpdateSector no está provista por appData.");
    }
    setIsEditingSectorName(false);
  };

  const startEditing = (routine) => {
    setLocalError('');
    setConfirmDeleteId(null); 
    setEditingRoutineId(routine.id);
    setEditData({
      startTime: formatTime(routine.startTime),
      durationMinutes: routine.durationMinutes
    });

    isProgrammaticScroll.current = true;
    setTimeout(() => {
      const element = routineRefs.current[routine.id];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setTimeout(() => { isProgrammaticScroll.current = false; }, 500);
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '120px' }}>
      
      <style>{`
        /* NUEVO: REGLA MAESTRA DE CAJA PARA EVITAR CORTES EN FORMULARIOS */
        *, *::before, *::after {
          box-sizing: border-box;
        }

        .history-filter-layout {
          display: flex;
          align-items: center;
          gap: 6px;
          position: relative;
          width: 100%;
          min-width: 0;
          margin-top: 4px;
        }

        .btn-fixed-new {
          flex-shrink: 0 !important;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          border: 1px dashed rgba(255, 255, 255, 0.45) !important;
          background: rgba(255, 255, 255, 0.12) !important;
          color: var(--text-muted) !important;
          cursor: pointer;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
          transition: all 0.15s cubic-bezier(0.2, 0.8, 0.2, 1) !important;
        }
        .btn-fixed-new:hover, .btn-fixed-new.active {
          border: 1px solid var(--primary) !important;
          background: rgba(16, 185, 129, 0.15) !important;
          color: var(--primary) !important;
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.25);
        }
        .btn-fixed-new:active {
          transform: scale(0.92);
        }

        .carousel-shadow-wrapper {
          position: relative;
          flex: 1;
          min-width: 0;
          display: flex;
          -webkit-mask-image: linear-gradient(to right, black, black);
          mask-image: linear-gradient(to right, black, black);
        }
        .carousel-shadow-wrapper.show-left.show-right {
          -webkit-mask-image: linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent);
          mask-image: linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent);
        }
        .carousel-shadow-wrapper.show-left:not(.show-right) {
          -webkit-mask-image: linear-gradient(to right, transparent, black 16px, black);
          mask-image: linear-gradient(to right, transparent, black 16px, black);
        }
        .carousel-shadow-wrapper.show-right:not(.show-left) {
          -webkit-mask-image: linear-gradient(to left, transparent, black 16px, black);
          mask-image: linear-gradient(to left, transparent, black 16px, black);
        }

        .filter-scroll-area {
          display: flex;
          align-items: center;
          gap: 6px;
          overflow-x: auto;
          overscroll-behavior-x: contain;
          touch-action: pan-x;
          -webkit-overflow-scrolling: touch;
          padding: 2px 4px 2px 0;
          scrollbar-width: none;
          flex: 1;
        }
        .filter-scroll-area::-webkit-scrollbar {
          display: none;
        }

        .chip {
          flex-shrink: 0;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
          transition: all 0.15s cubic-bezier(0.2, 0.8, 0.2, 1);
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: var(--text-muted, #94a3b8);
          display: flex;
          align-items: center;
          gap: 6px;
          max-width: 160px;
        }
        .chip:active {
          transform: scale(0.96);
        }
        .chip.active {
          background: rgba(16, 185, 129, 0.12);
          border-color: var(--primary, #10b981);
          color: var(--primary, #10b981);
        }
        .chip-text {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: inline-block;
          vertical-align: middle;
        }

        .led-wrapper {
          width: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .led-ring {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          transition: all 0.25s ease;
          box-sizing: border-box;
        }
        .led-ring.active {
          background: var(--primary);
          border: none;
          box-shadow: 0 0 6px rgba(16, 185, 129, 0.8);
        }
        .led-ring.paused {
          background: transparent;
          border: 1.5px solid var(--text-muted);
          opacity: 0.6;
        }

        .btn-icon-action {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
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
        .btn-icon-action.active-edit {
          color: var(--primary);
          border-color: var(--primary);
          background: rgba(16, 185, 129, 0.12);
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.2);
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

        /* SCROLL ORGÁNICO: Sin límites de altura */
        .routines-scroll-area {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 2px 0px;
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
        
        /* ESTILO PARA EL INPUT EDITABLE EN LÍNEA (CORREGIDO PARA NO SALTAR) */
        .inline-edit-input {
          width: 100%;
          font-size: 1.4rem;
          font-weight: 700;
          line-height: 1.25;
          color: var(--text-main);
          background: rgba(0,0,0,0.15);
          border: 1px solid var(--primary);
          border-radius: 8px;
          padding: 2px 8px; /* Reducido para no estirar la tarjeta */
          margin: 0; /* Eliminado el margin-bottom que empujaba la tarjeta */
          height: 32px; /* Altura forzada similar al texto original */
          outline: none;
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.15);
          transition: all 0.2s ease;
        }
        .inline-edit-input:focus {
          background: rgba(0,0,0,0.25);
          box-shadow: 0 0 15px rgba(16, 185, 129, 0.3);
        }
      `}</style>

      {/* === CABECERA DE SECTORES === */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 4px' }}>
          <span style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Mis Sectores
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button 
              type="button"
              className="btn-icon-action"
              onClick={() => handleToggleAllSectors(true)} 
              title="Habilitar todos los sectores"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
              </svg>
            </button>
          </div>
        </div>

        <div className="history-filter-layout">
          <button 
            className={`btn-fixed-new ${selectedTab === 'NEW' ? 'active' : ''}`} 
            onClick={() => handleTabClick('NEW')}
            title="Crear nuevo sector"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>

          <div className={`carousel-shadow-wrapper ${scrollShadowsTabs.left ? 'show-left' : ''} ${scrollShadowsTabs.right ? 'show-right' : ''}`}>
            <div 
              ref={tabsScrollRef}
              className="filter-scroll-area"
              onScroll={handleHorizontalScrollTabs}
              onTouchStart={handleTouchStartTabs}
              onTouchMove={handleTouchMoveTabs}
              onMouseDown={handleTouchStartTabs}
              onMouseMove={handleTouchMoveTabs}
            >
              {sectors.map(sector => {
                const isEnabled = sector.enabled !== false;
                const isSelected = selectedTab === sector.id;
                return (
                  <button 
                    key={sector.id} 
                    className={`chip ${isSelected ? 'active' : ''}`} 
                    onClick={() => handleTabClick(sector.id)} 
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
      </div>

      {selectedTab !== 'NEW' && selectedSectorObj && (
        <div key={selectedTab} className="sector-content-transition">
          
          <div style={{ position: 'relative' }}>
            {/* === BARRA DE HERRAMIENTAS DEL SECTOR === */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px', paddingRight: '4px', gap: '8px' }}>
              
              {/* BOTÓN DE BORRAR SECTOR (Animado) */}
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirmDeleteSectorId === selectedTab) {
                    if (handleDeleteSector) handleDeleteSector(selectedTab);
                  } else {
                    setConfirmDeleteSectorId(selectedTab);
                  }
                }}
                onBlur={() => setConfirmDeleteSectorId(null)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  height: '28px',
                  width: confirmDeleteSectorId === selectedTab ? '90px' : '28px',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  border: confirmDeleteSectorId === selectedTab ? 'none' : '1px solid var(--surface-border)',
                  background: confirmDeleteSectorId === selectedTab ? 'var(--danger, #ef4444)' : 'rgba(255, 255, 255, 0.03)',
                  color: confirmDeleteSectorId === selectedTab ? '#ffffff' : 'var(--text-muted)',
                  transition: 'all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
                  padding: 0,
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  fontWeight: '600',
                  fontSize: '0.8rem'
                }}
                title={confirmDeleteSectorId === selectedTab ? "Confirmar" : "Eliminar Sector"}
              >
                {confirmDeleteSectorId === selectedTab ? (
                  <span>¿Seguro?</span>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                )}
              </button>

              <button 
                type="button"
                className={`btn-icon-action ${isEditingSectorName ? 'active-edit' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isEditingSectorName) {
                    handleSaveSectorName(e);
                  } else {
                    setEditedSectorName(selectedSectorObj.name);
                    setIsEditingSectorName(true);
                  }
                }}
                title={isEditingSectorName ? "Guardar nombre" : "Editar nombre"}
              >
                {isEditingSectorName ? (
                  /* ICONO GUARDAR - Reducido a 14px para que coincida exactamente con el de editar */
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : (
                  /* ICONO EDITAR (14px) */
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                )}
              </button>
            </div>

            <div 
              className="glass-panel interactive-card" 
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '84px', gap: '16px' }}
              onClick={() => { if (!isEditingSectorName) handleToggleSector(selectedSectorObj); }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                {isEditingSectorName ? (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input 
                      type="text"
                      value={editedSectorName}
                      onChange={(e) => setEditedSectorName(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveSectorName(e);
                        if (e.key === 'Escape') setIsEditingSectorName(false);
                      }}
                      autoFocus
                      className="inline-edit-input"
                    />
                  </div>
                ) : (
                  <h3 className="card-title-shield" title={selectedSectorObj.name}>
                    {selectedSectorObj.name}
                  </h3>
                )}
                
                {selectedSectorObj.description && selectedSectorObj.description.trim() !== '' && (
                  <p 
                    className="text-muted" 
                    title={selectedSectorObj.description} 
                    style={{ fontSize: '0.95rem', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                  >
                    {selectedSectorObj.description}
                  </p>
                )}
              </div>
              
              <div className="flex-shrink-zero" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {(() => {
                  const isSectorEnabled = selectedSectorObj.enabled !== false;
                  return (
                    <div style={{
                      minWidth: '100px', 
                      padding: '8px 12px',
                      borderRadius: '12px',
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
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 4px' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Rutinas Programadas {sortedConfigs.length > 0 && <span style={{ color: 'var(--primary)', fontWeight: '800' }}>({sortedConfigs.length})</span>}
              </span>
              
              {sortedConfigs.length > 0 && typeof handleToggleAllConfigurations === 'function' && (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button 
                    type="button"
                    className="btn-icon-action"
                    onClick={(e) => { e.stopPropagation(); handleToggleAllConfigurations(selectedTab, true); }} 
                    title="Activar todas las rutinas"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
                <div className="routines-scroll-area">
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
              )}
            </div>
          </div>

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
                    <div key={routine.id} className={`animated-row ${isRemoving ? 'row-exit' : 'row-enter'}`}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                        
                        <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                          {index === 0 && <label style={{ fontSize: '0.8rem', marginBottom: '4px' }}>Hora</label>}
                          <input 
                            type="time" value={routine.startTime} 
                            onChange={e => handleChangeRoutineRow(routine.id, 'startTime', e.target.value)} 
                            className={routine.errorTime ? 'input-error' : ''}
                            style={{ transition: 'border-color 0.2s ease, background 0.2s ease' }}
                          />
                        </div>
                        
                        <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                          {index === 0 && <label style={{ fontSize: '0.8rem', marginBottom: '4px' }}>Min</label>}
                          <input 
                            type="number" min="5" max="180" value={routine.durationMinutes} 
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
                                <span>{routine.errorTime}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div style={{ flex: 1 }}>
                          <div className={`error-message-wrapper ${routine.errorDuration ? 'show' : ''}`}>
                            <div className="error-message-content">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', fontWeight: '600' }}>
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

                <button type="submit" className="btn-primary" style={{ padding: '14px', marginTop: '8px', opacity: isSaving ? 0.7 : 1, fontSize: '1rem' }} disabled={isSaving}>
                  {isSaving ? 'Guardando...' : `Guardar ${routineList.length > 1 ? routineList.length + ' rutinas' : 'rutina'}`}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

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
              />
              <div className={`error-message-wrapper ${sectorNameError ? 'show' : ''}`}>
                <div className="error-message-content">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', fontWeight: '600' }}>
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