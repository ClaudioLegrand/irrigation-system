import React, { useState, useEffect, useRef, useMemo } from 'react';

export default function HistoryView(props) {
  const appData = props.appData || props || {};
  
  const rawHistory = Array.isArray(appData) 
    ? appData 
    : (appData.irrigationHistory || appData.history || appData.historial || appData.logs || appData.records || appData.activities || appData.activityLog || appData.registros || props.irrigationHistory || props.history || props.historial || props.logs || props.records || []);

  const [expandedId, setExpandedId] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  
  // NUEVOS ESTADOS: Filtro de Mes y Límite de Paginación
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [visibleLimit, setVisibleLimit] = useState(20);
  const [isMonthMenuOpen, setIsMonthMenuOpen] = useState(false);

  const [scrollShadows, setScrollShadows] = useState({ left: false, right: false });
  const tabsScrollRef = useRef(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);

  useEffect(() => {
    if (typeof appData.fetchHistory === 'function') appData.fetchHistory();
    else if (typeof appData.getHistory === 'function') appData.getHistory();
    else if (typeof appData.loadHistory === 'function') appData.loadHistory();
    else if (typeof appData.handleFetchHistory === 'function') appData.handleFetchHistory();
    else if (typeof appData.obtenerHistorial === 'function') appData.obtenerHistorial();
  }, []);

  const checkHorizontalScroll = () => {
    const el = tabsScrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const hasScroll = scrollWidth > clientWidth;
    const isAtLeft = scrollLeft <= 2;
    const isAtRight = scrollWidth - scrollLeft - clientWidth <= 2;
    
    setScrollShadows({
      left: !isAtLeft && hasScroll,
      right: !isAtRight && hasScroll
    });
  };

  useEffect(() => {
    checkHorizontalScroll();
    const timer = setTimeout(checkHorizontalScroll, 350);
    return () => clearTimeout(timer);
  }, [appData.sectors]);

  const handleHorizontalScroll = (e) => {
    const { scrollLeft, scrollWidth, clientWidth } = e.currentTarget;
    const hasScroll = scrollWidth > clientWidth;
    setScrollShadows({
      left: scrollLeft > 2 && hasScroll,
      right: scrollWidth - scrollLeft - clientWidth > 2 && hasScroll
    });
  };

  const handleTouchStart = (e) => {
    isDraggingRef.current = false;
    const touch = e.touches ? e.touches[0] : e;
    startXRef.current = touch.clientX;
    startYRef.current = touch.clientY;
  };

  const handleTouchMove = (e) => {
    const touch = e.touches ? e.touches[0] : e;
    const diffX = Math.abs(touch.clientX - startXRef.current);
    const diffY = Math.abs(touch.clientY - startYRef.current);

    if (diffX > 4 && diffX > diffY) {
      isDraggingRef.current = true;
      if (e.stopPropagation) e.stopPropagation();
    }
  };

  const handleFilterClick = (filterId) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      return; 
    }
    setSelectedFilter(filterId);
    setVisibleLimit(20); // Reseteamos la paginación al cambiar de pestaña
    setExpandedId(null);
  };

  const handleMonthChange = (monthValue) => {
    setSelectedMonth(monthValue);
    setVisibleLimit(20); // Reseteamos la paginación al cambiar de mes
    setExpandedId(null);
    setIsMonthMenuOpen(false); // Cerramos el menú al elegir
  };

  const toggleExpand = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const getSectorObj = (item) => {
    const secId = item.sector_id || item.sectorId || item.id_sector;
    if (secId && appData.sectors && Array.isArray(appData.sectors)) {
      return appData.sectors.find(s => String(s.id) === String(secId));
    }
    return null;
  };

  const getSectorName = (item) => {
    if (item.sectorName || item.sector_name) return item.sectorName || item.sector_name;
    if (item.sector && typeof item.sector === 'object') return item.sector.name || item.sector.nombre || 'Sector de Riego';
    if (typeof item.sector === 'string') return item.sector;
    if (item.nombreSector || item.nombre_sector) return item.nombreSector || item.nombre_sector;
    if (item.name || item.nombre || item.zona) return item.name || item.nombre || item.zona;
    
    const foundSector = getSectorObj(item);
    if (foundSector && foundSector.name) return foundSector.name;
    return 'Sector de Riego';
  };

  const formatDateTime = (rawTime) => {
    if (!rawTime) return { timeShort: '--:--', timeExact: '--:--:--', date: '' };

    if (typeof rawTime === 'string') {
      const cleanStr = rawTime.trim();
      const parts = cleanStr.includes('T') ? cleanStr.split('T') : cleanStr.split(' ');
      
      let datePart = '';
      let timeExact = '';
      let timeShort = '';

      if (parts.length >= 2) {
        const dParts = parts[0].split('-');
        if (dParts.length === 3) {
          datePart = `${dParts[2]}/${dParts[1]}/${dParts[0]}`;
        } else {
          datePart = parts[0];
        }
        
        timeExact = parts[1].split('.')[0];
        timeShort = timeExact.substring(0, 5);
        return { timeShort, timeExact, date: datePart };
      }
      
      if (cleanStr.includes(':')) {
        const clean = cleanStr.split('.')[0];
        return { timeShort: clean.substring(0, 5), timeExact: clean, date: '' };
      }
    }

    if (Array.isArray(rawTime) && rawTime.length >= 5) {
      const y = rawTime[0];
      const m = String(rawTime[1]).padStart(2, '0');
      const d = String(rawTime[2]).padStart(2, '0');
      const hr = String(rawTime[3]).padStart(2, '0');
      const min = String(rawTime[4]).padStart(2, '0');
      const sec = rawTime[6] ? String(rawTime[5]).padStart(2, '0') : '00';
      return { timeShort: `${hr}:${min}`, timeExact: `${hr}:${min}:${sec}`, date: `${d}/${m}/${y}` };
    }

    let numTime = Number(rawTime);
    if (!isNaN(numTime) && numTime > 0) {
      if (numTime < 100000000000) numTime *= 1000;
      const d = new Date(numTime);
      if (!isNaN(d.getTime())) {
        const h = String(d.getHours()).padStart(2, '0');
        const m = String(d.getMinutes()).padStart(2, '0');
        const s = String(d.getSeconds()).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        return { timeShort: `${h}:${m}`, timeExact: `${h}:${m}:${s}`, date: `${day}/${month}/${d.getFullYear()}` };
      }
    }

    return { timeShort: '--:--', timeExact: '--:--:--', date: '' };
  };

  const parseToTimestamp = (val) => {
    if (!val) return 0;
    if (typeof val === 'number') return val < 100000000000 ? val * 1000 : val;
    if (typeof val === 'string') {
      const cleanStr = val.trim().replace(' ', 'T').split('.')[0];
      const d = new Date(cleanStr);
      if (!isNaN(d.getTime())) return d.getTime();
    }
    return 0;
  };

  // NUEVA LÓGICA: Obtener el tiempo de "Última Actividad" (Prioriza el fin si ya terminó)
  const getSortTime = (item) => {
    const tStart = parseToTimestamp(item.start_date_time || item.startDateTime || item.startTime || item.start_time || item.timestamp || item.created_at || item.createdAt);
    const tEnd = parseToTimestamp(item.end_date_time || item.endDateTime || item.endTime || item.end_time);
    // Retorna el mayor de los dos (El que haya ocurrido más recientemente)
    return tEnd > tStart ? tEnd : tStart;
  };

  const getDuration = (item) => {
    const dur = item.durationMinutes || item.duration_minutes || item.duration || item.duracion || item.duracion_minutos || item.minutes || item.minutos;
    if (dur !== undefined && dur !== null && dur !== '') return `${dur} min`;
    
    const tStart = parseToTimestamp(item.start_date_time || item.startDateTime || item.startTime || item.start_time);
    const tEnd = parseToTimestamp(item.end_date_time || item.endDateTime || item.endTime || item.end_time);
    
    if (tStart > 0 && tEnd > tStart) {
      const diffMin = Math.round((tEnd - tStart) / 60000);
      if (diffMin <= 0) return '< 1 min';
      return `${diffMin} min`;
    }
    return '1 min';
  };

  const formatTrigger = (item) => {
    const trigger = item.origin_order || item.originOrder || item.triggerSource || item.trigger_source || item.triggeredBy || item.triggered_by || item.origen || item.source || item.tipo || item.type || 'MANUAL_APP';
    const lower = String(trigger).toLowerCase();
    
    if (lower.includes('manual') || lower.includes('app') || lower.includes('user') || lower.includes('usuario') || lower.includes('web')) return 'Manual (Aplicación)';
    if (lower.includes('schedul') || lower.includes('routin') || lower.includes('auto') || lower.includes('rutina') || lower.includes('program') || lower.includes('timer') || lower.includes('cron')) return 'Automático (Rutina)';
    if (lower.includes('hard') || lower.includes('button') || lower.includes('boton') || lower.includes('fisi') || lower.includes('physic') || lower.includes('switch') || lower.includes('sensor')) return 'Botón Físico';
    if (lower.includes('api') || lower.includes('system') || lower.includes('sistema') || lower.includes('server')) return 'Sistema (Automático)';
    return 'Manual (Aplicación)';
  };

  // === OPTIMIZACIÓN DE MEMORIA Y LOGS VIRTUALES (CACHÉ) ===
  const validHistory = useMemo(() => {
    const historyList = (rawHistory || []).filter(item => item !== null && typeof item === 'object');
    
    // 1. Identificamos sectores actualmente encendidos en la app
    const activeSectors = (appData.sectors || []).filter(s => {
      const st = s.current_state || s.currentState || s.status || s.state || s.estado || s.activo || s.running;
      return (st === true || st === 1 || st === '1' || ['ON', 'ACTIVE', 'ACTIVO', 'RUNNING', 'PRENDIDO', 'TRUE'].includes(String(st).trim().toUpperCase()));
    });

    // 2. Creamos logs virtuales para tapar el lag del servidor
    const virtualLogs = [];
    activeSectors.forEach(sector => {
      const secIdStr = String(sector.id);
      const sectorHistory = historyList.filter(h => String(h.sector_id || h.sectorId || h.id_sector) === secIdStr);
      
      // Buscamos el registro más reciente de este sector en la Base de Datos
      sectorHistory.sort((a, b) => getSortTime(b) - getSortTime(a));
      const latestRecord = sectorHistory.length > 0 ? sectorHistory[0] : null;
      
      // Si NO hay registro o el último ya está cerrado (Finalizado), inyectamos uno fantasma
      const isRealRecordFinished = !latestRecord || (latestRecord.end_date_time || latestRecord.endDateTime || latestRecord.endTime || latestRecord.end_time);
      
      if (isRealRecordFinished) {
        const now = new Date();
        virtualLogs.push({
          id: `virtual-${sector.id}-${now.getTime()}`,
          sectorId: sector.id,
          sectorName: sector.name,
          startDateTime: now.getTime(), // CRÍTICO: Usamos milisegundos puros para forzar la hora local (Argentina)
          triggerSource: 'Manual - Sincronizando...',
          isVirtual: true // Marca secreta para que el sistema sepa que es temporal
        });
      }
    });

    // 3. Fusionamos los datos virtuales en tiempo real con la historia real
    return [...virtualLogs, ...historyList];
  }, [rawHistory, appData.sectors]);
  
  // Extraemos todos los meses únicos del historial ("YYYY-MM")
  const availableMonths = useMemo(() => {
    const months = new Set();
    validHistory.forEach(item => {
       const t = getSortTime(item);
       if (t > 0) {
         const d = new Date(t);
         const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
         months.add(key);
       }
    });
    return Array.from(months).sort().reverse(); // Ordenados de más reciente a más viejo
  }, [validHistory]);

  const formatMonthLabel = (YYYYMM, isShort = false) => {
    if (!YYYYMM) return '';
    const [year, month] = YYYYMM.split('-');
    const date = new Date(year, parseInt(month, 10) - 1, 1);
    let monthName = date.toLocaleDateString('es-ES', { month: isShort ? 'short' : 'long' }).replace('.', '');
    return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
  };

  // 1. ORDENAMOS EL HISTORIAL POR ÚLTIMA ACTIVIDAD (Fin o Inicio)
  const sortedHistory = useMemo(() => {
    return [...validHistory].sort((a, b) => getSortTime(b) - getSortTime(a));
  }, [validHistory]);

  // 2. NUEVA LÓGICA DE ESTADO (Ya no recicla registros viejos)
  const checkIsActive = (item) => {
    if (item.isVirtual) return true; // Nuestros registros fantasma siempre están activos

    if (item.active === true || item.activo === true || item.isRunning === true || item.is_running === true || item.prendido === true) return true;
    if (item.active === false || item.activo === false || item.isRunning === false || item.is_running === false) return false;

    // Verificamos si es un registro real que aún no tiene fecha de fin
    const isFinished = !!(item.end_date_time || item.endDateTime || item.endTime || item.end_time);
    if (!isFinished) {
      // Confirmamos con el sector actual por seguridad
      const sector = getSectorObj(item);
      if (sector) {
        const st = sector.current_state || sector.currentState || sector.status || sector.state || sector.estado || sector.activo || sector.running;
        return (st === true || st === 1 || st === '1' || ['ON', 'ACTIVE', 'ACTIVO', 'RUNNING', 'PRENDIDO', 'TRUE'].includes(String(st).trim().toUpperCase()));
      }
      return true; // Fallback si está abierto y no encontramos el sector
    }
    return false;
  };

  const filteredHistory = useMemo(() => {
    return sortedHistory.filter(item => {
      // Filtro 1: Sector
      let passSector = true;
      if (selectedFilter !== 'ALL') {
        const secObj = getSectorObj(item);
        if (secObj && String(secObj.id) === String(selectedFilter)) {
          passSector = true;
        } else {
          const itemSecName = getSectorName(item);
          const filterSecObj = appData.sectors?.find(s => String(s.id) === String(selectedFilter));
          if (filterSecObj && itemSecName === filterSecObj.name) passSector = true;
          else passSector = false;
        }
      }
      
      // Filtro 2: Mes
      let passMonth = true;
      if (selectedMonth !== 'ALL') {
         const t = getSortTime(item);
         if (t > 0) {
            const d = new Date(t);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (key !== selectedMonth) passMonth = false;
         } else {
            passMonth = false;
         }
      }

      return passSector && passMonth;
    });
  }, [sortedHistory, selectedFilter, selectedMonth, appData.sectors]);

  // APLICAMOS EL LÍMITE DE RENDERIZADO (Previene el Lag)
  const displayedHistory = useMemo(() => {
    return filteredHistory.slice(0, visibleLimit);
  }, [filteredHistory, visibleLimit]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      
      <style>{`
        /* Estilos heredados base */
        .history-content-transition {
          animation: slideFadeInHistory 0.60s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes slideFadeInHistory {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
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
        
        .btn-circle-all {
          flex-shrink: 0;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
          transition: all 0.15s cubic-bezier(0.2, 0.8, 0.2, 1);
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: var(--text-muted, #94a3b8);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .btn-circle-all:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-main, #ffffff);
        }
        .btn-circle-all:active {
          transform: scale(0.92);
        }
        .btn-circle-all.active {
          background: rgba(16, 185, 129, 0.15);
          border-color: var(--primary, #10b981);
          color: var(--primary, #10b981);
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.25);
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

        .filter-chip {
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
        .filter-chip:active {
          transform: scale(0.96);
        }
        .filter-chip.active {
          background: rgba(16, 185, 129, 0.12);
          border-color: var(--primary, #10b981);
          color: var(--primary, #10b981);
        }
        .filter-chip-text {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
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
        }
        .led-ring.active {
          background: var(--primary, #10b981);
          box-shadow: 0 0 6px rgba(16, 185, 129, 0.8);
        }
        .led-ring.paused {
          background: transparent;
          border: 1.5px solid var(--text-muted, #64748b);
          opacity: 0.6;
        }

        .history-card {
          background: rgba(255, 255, 255, 0.03);
          padding: 9px 14px;
          border-radius: 14px;
          cursor: pointer;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
          transition: padding 0.3s cubic-bezier(0.16, 1, 0.3, 1), background 0.25s ease, transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1), border-color 0.25s ease, box-shadow 0.25s ease;
          border-left: 4px solid var(--text-muted, #64748b);
        }
        .history-card.is-open {
          padding: 14px 14px;
          background: rgba(255, 255, 255, 0.05);
        }
        .history-card:hover {
          background: rgba(255, 255, 255, 0.06);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .history-card:active {
          transform: scale(0.985) !important;
          background: rgba(255, 255, 255, 0.08);
        }
        .history-card.is-active {
          border-left-color: var(--primary, #10b981);
        }

        .history-accordion {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.40s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.30s ease;
          opacity: 0;
          overflow: hidden;
        }
        .history-accordion.expanded {
          grid-template-rows: 1fr;
          opacity: 1;
        }
        .history-accordion-content {
          min-height: 0;
          overflow: hidden;
          padding-top: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          margin-top: 10px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .flex-shrink-zero {
          flex-shrink: 0 !important;
        }

        /* ANIMACIÓN DE CASCADA SUAVE */
        .history-card-animate {
          animation: slideFadeInCard 0.35s cubic-bezier(0.2, 0.8, 0.2, 1) backwards;
        }
        @keyframes slideFadeInCard {
          0% { opacity: 0; transform: translateY(12px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* NUEVOS ESTILOS: Select Custom de Mes y Botón Cargar Más */
        .custom-dropdown-btn {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: var(--text-main);
          padding: 6px 10px; /* Reducimos padding para ahorrar espacio */
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
          outline: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-width: 110px; /* Ancho ultra compacto */
          max-width: 110px; /* Bloqueamos el crecimiento para siempre */
          gap: 6px;
          transition: all 0.2s ease;
        }
        .custom-dropdown-btn:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .dropdown-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          z-index: 40;
        }
        
        .dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          background: #1e293b;
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 16px;
          padding: 6px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
          z-index: 50;
          min-width: 140px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          animation: dropIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transform-origin: top right;
        }
        @keyframes dropIn {
          0% { opacity: 0; transform: scale(0.95) translateY(-5px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        
        .dropdown-item {
          padding: 10px 12px;
          border-radius: 10px;
          background: transparent;
          border: none;
          color: var(--text-main);
          font-size: 0.85rem;
          font-weight: 600;
          text-align: left;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .dropdown-item:hover {
          background: rgba(255,255,255,0.1);
        }
        .dropdown-item.active {
          color: var(--primary);
          background: rgba(16, 185, 129, 0.12);
        }

        .btn-load-more {
          width: 100%;
          padding: 12px;
          border-radius: 14px;
          border: 1px dashed rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.03);
          color: var(--text-muted);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 6px;
        }
        .btn-load-more:hover {
          background: rgba(255,255,255,0.06);
          color: var(--text-main);
          border-color: rgba(255,255,255,0.3);
        }
        .btn-load-more:active {
          transform: scale(0.98);
        }
      `}</style>

      {/* === JERARQUÍA EXTERIOR === */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
          
          <div style={{ flex: '1 1 auto', minWidth: 0 }}>
            <div style={{ 
              fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-muted, #94a3b8)', 
              textTransform: 'uppercase', letterSpacing: '0.5px',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>HISTORIAL DE RIEGO</span>
              {filteredHistory.length > 0 && <span style={{ color: 'var(--primary, #10b981)', fontWeight: '800', flexShrink: 0 }}>({filteredHistory.length})</span>}
            </div>
          </div>
          
          {/* NUEVO: SELECTOR DE MESES CUSTOMIZADO */}
          {availableMonths.length > 0 && (
            <div style={{ flexShrink: 0, position: 'relative' }}>
              <button 
                className="custom-dropdown-btn"
                onClick={() => setIsMonthMenuOpen(!isMonthMenuOpen)}
                title="Filtrar por mes"
              >
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {selectedMonth === 'ALL' ? 'Histórico' : formatMonthLabel(selectedMonth, true)}
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: 'transform 0.2s', transform: isMonthMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              
              {isMonthMenuOpen && (
                <>
                  <div className="dropdown-overlay" onClick={() => setIsMonthMenuOpen(false)}></div>
                  <div className="dropdown-menu">
                    <button className={`dropdown-item ${selectedMonth === 'ALL' ? 'active' : ''}`} onClick={() => handleMonthChange('ALL')}>
                      Histórico
                    </button>
                    {availableMonths.map(m => (
                      <button key={m} className={`dropdown-item ${selectedMonth === m ? 'active' : ''}`} onClick={() => handleMonthChange(m)}>
                        {formatMonthLabel(m, false)}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* SUBTÍTULO EN SU PROPIA LÍNEA PARA NO CORTARSE */}
        <p className="text-muted" style={{ fontSize: '0.85rem', margin: 0, opacity: 0.8, width: '100%' }}>
          Registro de las últimas actividades
        </p>
      </div>

      {/* === BARRA HORIZONTAL MINIATURIZADA (WHATSAPP STYLE) === */}
      <div className="history-filter-layout">
        
        <button
          type="button"
          className={`btn-circle-all ${selectedFilter === 'ALL' ? 'active' : ''}`}
          onClick={() => handleFilterClick('ALL')}
          title="Mostrar todo el historial"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
        </button>

        <div className={`carousel-shadow-wrapper ${scrollShadows.left ? 'show-left' : ''} ${scrollShadows.right ? 'show-right' : ''}`}>
          <div
            ref={tabsScrollRef}
            className="filter-scroll-area"
            onScroll={handleHorizontalScroll}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onMouseDown={handleTouchStart}
            onMouseMove={handleTouchMove}
          >
            {(appData.sectors || []).map(sector => {
              const isSelected = String(selectedFilter) === String(sector.id);
              const st = sector.current_state || sector.currentState || sector.status || sector.state || sector.estado || sector.activo;
              const isRunning = (st === true || st === 1 || st === '1' || ['ON', 'ACTIVE', 'ACTIVO', 'RUNNING', 'PRENDIDO', 'TRUE'].includes(String(st).trim().toUpperCase()));

              return (
                <button
                  key={sector.id}
                  type="button"
                  className={`filter-chip ${isSelected ? 'active' : ''}`}
                  onClick={() => handleFilterClick(sector.id)}
                  title={`Filtrar por ${sector.name}`}
                >
                  <span className="led-wrapper">
                    <span className={`led-ring ${isRunning ? 'active' : 'paused'}`}></span>
                  </span>
                  <span className="filter-chip-text">{sector.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* === CONTENEDOR PRINCIPAL === */}
      <div className="glass-panel history-content-transition" style={{ padding: '12px 14px' }}>
        {displayedHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '28px 10px' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted, #64748b)', opacity: 0.5, margin: '0 auto 8px auto', display: 'block' }}>
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
            </svg>
            <p className="text-muted" style={{ fontSize: '0.95rem', margin: 0 }}>
              {selectedFilter === 'ALL' 
                ? 'No hay registros de actividad para este periodo.' 
                : 'No hay actividad registrada para este sector.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {displayedHistory.map((item, index) => {
              const itemId = item.id || item._id || item.logId || index;
              const isExpanded = expandedId === itemId;
              const isActive = checkIsActive(item); // <-- Actualizado aquí
              
              const sectorTitle = getSectorName(item);
              const startData = formatDateTime(item.start_date_time || item.startDateTime || item.startTime || item.start_time || item.timestamp || item.created_at);
              const endData = formatDateTime(item.end_date_time || item.endDateTime || item.endTime || item.end_time);
              const durationText = getDuration(item);
              const triggerText = formatTrigger(item);

              return (
                <div 
                  key={itemId}
                  className={`history-card history-card-animate ${isActive ? 'is-active' : ''} ${isExpanded ? 'is-open' : ''}`}
                  onClick={() => toggleExpand(itemId)}
                  style={{ animationDelay: `${(index % 20) * 0.03}s` }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main, #ffffff)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                        {sectorTitle}
                      </h4>

                      <div className="flex-shrink-zero" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{
                          minWidth: '110px',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          letterSpacing: '0.5px',
                          border: `1px solid ${isActive ? 'var(--primary, #10b981)' : 'rgba(255, 255, 255, 0.12)'}`,
                          background: isActive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                          color: isActive ? 'var(--primary, #10b981)' : 'var(--text-muted, #94a3b8)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px',
                          transition: 'all 0.3s ease'
                        }}>
                          <span style={{
                            width: '6px', height: '6px', borderRadius: '50%',
                            background: isActive ? 'var(--primary, #10b981)' : 'var(--text-muted, #64748b)',
                            boxShadow: isActive ? '0 0 6px rgba(16, 185, 129, 0.8)' : 'none',
                            transition: 'all 0.3s ease'
                          }}></span>
                          <span>{isActive ? 'PRENDIDO' : 'FINALIZADO'}</span>
                        </div>

                        <div style={{
                          width: '22px', height: '22px', borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'var(--text-muted, #94a3b8)', transition: 'transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)',
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                        }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted, #94a3b8)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {startData.date ? `${startData.date} • ` : ''}<strong style={{ color: 'var(--text-main, #ffffff)', fontWeight: '600' }}>{startData.timeShort} hs</strong>
                    </div>

                  </div>

                  <div className={`history-accordion ${isExpanded ? 'expanded' : ''}`}>
                    <div className="history-accordion-content">
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span className="text-muted" style={{ color: 'var(--text-muted, #94a3b8)' }}>Inicio exacto:</span>
                        <span style={{ fontWeight: '600', color: 'var(--text-main, #ffffff)' }}>
                          {startData.timeExact !== '--:--:--' ? `${startData.timeExact} hs` : startData.timeShort} {startData.date ? `(${startData.date})` : ''}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span className="text-muted" style={{ color: 'var(--text-muted, #94a3b8)' }}>Fin de riego:</span>
                        {isActive ? (
                          <span style={{ fontWeight: '700', color: 'var(--primary, #10b981)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary, #10b981)' }}></span>
                            En curso
                          </span>
                        ) : (
                          <span style={{ fontWeight: '600', color: 'var(--text-main, #ffffff)' }}>
                            {endData.timeExact !== '--:--:--' ? `${endData.timeExact} hs` : (endData.timeShort !== '--:--' ? `${endData.timeShort} hs` : 'Completado')} {endData.date ? `(${endData.date})` : ''}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span className="text-muted" style={{ color: 'var(--text-muted, #94a3b8)' }}>Tiempo total:</span>
                        <span style={{ fontWeight: '600', color: 'var(--text-main, #ffffff)' }}>{durationText}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span className="text-muted" style={{ color: 'var(--text-muted, #94a3b8)' }}>Origen de orden:</span>
                        <span style={{ fontWeight: '600', color: 'var(--primary, #10b981)' }}>{triggerText}</span>
                      </div>

                      {(item.observations || item.observaciones || item.notes || item.notas) && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderTop: '1px dashed rgba(255,255,255,0.08)', paddingTop: '8px', marginTop: '2px' }}>
                          <span className="text-muted" style={{ color: 'var(--text-muted, #94a3b8)' }}>Nota del sistema:</span>
                          <span style={{ fontWeight: '600', color: 'var(--text-main, #ffffff)', textAlign: 'right', flex: 1, marginLeft: '12px' }}>
                            {item.observations || item.observaciones || item.notes || item.notas}
                          </span>
                        </div>
                      )}

                    </div>
                  </div>

                </div>
              );
            })}

            {/* NUEVO: BOTÓN CARGAR MÁS */}
            {filteredHistory.length > visibleLimit && (
              <button 
                className="btn-load-more"
                onClick={() => setVisibleLimit(prev => prev + 20)}
              >
                Ver más actividad ({filteredHistory.length - visibleLimit} restantes)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}