import React, { useState, useEffect } from 'react';

export default function HistoryView(props) {
  const appData = props.appData || props || {};
  
  // Recepción blindada buscando todas las variantes de nombres de tabla en Java/MySQL
  const rawHistory = Array.isArray(appData) 
    ? appData 
    : (appData.irrigationHistory || appData.history || appData.historial || appData.logs || appData.records || appData.activities || appData.activityLog || appData.registros || props.irrigationHistory || props.history || props.historial || props.logs || props.records || []);

  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (typeof appData.fetchHistory === 'function') appData.fetchHistory();
    else if (typeof appData.getHistory === 'function') appData.getHistory();
    else if (typeof appData.loadHistory === 'function') appData.loadHistory();
    else if (typeof appData.handleFetchHistory === 'function') appData.handleFetchHistory();
    else if (typeof appData.obtenerHistorial === 'function') appData.obtenerHistorial();
  }, []);

  const toggleExpand = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  // 1. BUSCADOR DE SECTORES POR SECTOR_ID
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

  // 2. EXTRACTOR DE TIEMPOS QUIRÚRGICO (Compatible con "2026-07-23 16:43:19.960648")
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

  // 3. CÁLCULO DE DURACIÓN EXACTA
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

  // 4. TRADUCTOR DE ORIGEN (origin_order -> "Manual (Aplicación)")
  const formatTrigger = (item) => {
    const trigger = item.origin_order || item.originOrder || item.triggerSource || item.trigger_source || item.triggeredBy || item.triggered_by || item.origen || item.source || item.tipo || item.type || 'MANUAL_APP';
    const lower = String(trigger).toLowerCase();
    
    if (lower.includes('manual') || lower.includes('app') || lower.includes('user') || lower.includes('usuario') || lower.includes('web')) {
      return 'Manual (Aplicación)';
    }
    if (lower.includes('schedul') || lower.includes('routin') || lower.includes('auto') || lower.includes('rutina') || lower.includes('program') || lower.includes('timer') || lower.includes('cron')) {
      return 'Automático (Rutina)';
    }
    if (lower.includes('hard') || lower.includes('button') || lower.includes('boton') || lower.includes('fisi') || lower.includes('physic') || lower.includes('switch') || lower.includes('sensor')) {
      return 'Botón Físico';
    }
    if (lower.includes('api') || lower.includes('system') || lower.includes('sistema') || lower.includes('server')) {
      return 'Sistema (Automático)';
    }
    return 'Manual (Aplicación)';
  };

  const validHistory = (rawHistory || []).filter(item => item !== null && typeof item === 'object');
  const sortedHistory = [...validHistory].sort((a, b) => {
    const tA = parseToTimestamp(a.start_date_time || a.startDateTime || a.startTime || a.start_time || a.timestamp || a.created_at || a.createdAt);
    const tB = parseToTimestamp(b.start_date_time || b.startDateTime || b.startTime || b.start_time || b.timestamp || b.created_at || b.createdAt);
    return tB - tA;
  });

  // 5. RADAR CRUZADO DE SECTORES
  const checkIsActive = (item, index) => {
    if (item.active === true || item.activo === true || item.isRunning === true || item.is_running === true || item.prendido === true) return true;
    if (item.active === false || item.activo === false || item.isRunning === false || item.is_running === false) return false;

    const sector = getSectorObj(item);
    if (sector) {
      const st = sector.current_state || sector.currentState || sector.status || sector.state || sector.estado || sector.activo || sector.running;
      
      if (st !== undefined && st !== null) {
        const isSectorRunning = (st === true || st === 1 || st === '1' || 
          ['ON', 'ACTIVE', 'ACTIVO', 'RUNNING', 'PRENDIDO', 'EJECUTANDO', 'IN_PROGRESS', 'TRUE'].includes(String(st).trim().toUpperCase()));
        
        if (isSectorRunning) {
          const secIdStr = String(item.sector_id || item.sectorId || item.id_sector);
          const firstIdxForSector = sortedHistory.findIndex(row => String(row.sector_id || row.sectorId || row.id_sector) === secIdStr);
          
          if (index === firstIdxForSector) {
            return true;
          }
        }
      }
    }

    return false;
  };

  return (
    // TRANSICIÓN DE 0.60s CONSERVADA
    <div className="history-content-transition" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      <style>{`
        .history-content-transition {
          animation: slideFadeInHistory 0.60s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes slideFadeInHistory {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        /* TARJETAS CON RELLENO GENEROSO (16px 18px) Y TACTO ELÁSTICO */
        .history-card {
          background: rgba(255, 255, 255, 0.03);
          padding: 16px 18px;
          border-radius: 16px;
          cursor: pointer;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
          transition: background 0.25s ease, transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1), border-color 0.25s ease, box-shadow 0.25s ease;
          border-left: 4px solid var(--text-muted, #64748b);
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
          background: rgba(255, 255, 255, 0.05);
        }

        /* ACORDEÓN FLUIDO (CSS Grid 0fr -> 1fr en 400ms) */
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
          padding-top: 14px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          margin-top: 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .flex-shrink-zero {
          flex-shrink: 0 !important;
        }
      `}</style>

      {/* === JERARQUÍA EXTERIOR === */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '0 4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Historial de Riego {sortedHistory.length > 0 && <span style={{ color: 'var(--primary, #10b981)', fontWeight: '800' }}>({sortedHistory.length})</span>}
          </span>
        </div>
        <p className="text-muted" style={{ fontSize: '0.85rem', margin: 0, opacity: 0.8 }}>
          Registro de las últimas actividades
        </p>
      </div>

      {/* === CONTENEDOR PRINCIPAL GLASS-PANEL === */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        {sortedHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '28px 10px' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted, #64748b)', opacity: 0.5, margin: '0 auto 8px auto', display: 'block' }}>
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
            </svg>
            <p className="text-muted" style={{ fontSize: '0.95rem', margin: 0 }}>
              No hay registros de actividad recientes en la base de datos.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sortedHistory.map((item, index) => {
              const itemId = item.id || item._id || item.logId || index;
              const isExpanded = expandedId === itemId;
              const isActive = checkIsActive(item, index);
              
              const sectorTitle = getSectorName(item);
              const startData = formatDateTime(item.start_date_time || item.startDateTime || item.startTime || item.start_time || item.timestamp || item.created_at);
              const endData = formatDateTime(item.end_date_time || item.endDateTime || item.endTime || item.end_time);
              const durationText = getDuration(item);
              const triggerText = formatTrigger(item);

              return (
                <div 
                  key={itemId}
                  className={`history-card ${isActive ? 'is-active' : ''}`}
                  onClick={() => toggleExpand(itemId)}
                >
                  {/* === VISTA COMPACTA MINIMALISTA (CERO DESBORDES) === */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    
                    {/* FILA 1: Nombre del Sector + Pastilla de Estado */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                      <h4 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main, #ffffff)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                        {sectorTitle}
                      </h4>

                      {/* PASTILLA BLINDADA (minWidth 115px) + FLECHA DESPLEGABLE */}
                      <div className="flex-shrink-zero" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          minWidth: '115px',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          letterSpacing: '0.5px',
                          border: `1px solid ${isActive ? 'var(--primary, #10b981)' : 'rgba(255, 255, 255, 0.12)'}`,
                          background: isActive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                          color: isActive ? 'var(--primary, #10b981)' : 'var(--text-muted, #94a3b8)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'all 0.3s ease'
                        }}>
                          <span style={{
                            width: '7px', height: '7px', borderRadius: '50%',
                            background: isActive ? 'var(--primary, #10b981)' : 'var(--text-muted, #64748b)',
                            boxShadow: isActive ? '0 0 6px rgba(16, 185, 129, 0.8)' : 'none',
                            transition: 'all 0.3s ease'
                          }}></span>
                          <span>{isActive ? 'PRENDIDO' : 'FINALIZADO'}</span>
                        </div>

                        {/* FLECHA DESPLEGABLE SUAVE */}
                        <div style={{
                          width: '24px', height: '24px', borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'var(--text-muted, #94a3b8)', transition: 'transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)',
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                        }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* FILA 2: Resumen Temporal Limpio (IMPOSIBLE DE ROMPER HORIZONTALMENTE) */}
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-muted, #94a3b8)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {startData.date ? `${startData.date} • ` : ''}<strong style={{ color: 'var(--text-main, #ffffff)', fontWeight: '600' }}>{startData.timeShort} hs</strong>
                    </div>

                  </div>

                  {/* === VISTA EXPANDIDA (FICHA TÉCNICA DE AUDITORÍA COMPLETA) === */}
                  <div className={`history-accordion ${isExpanded ? 'expanded' : ''}`}>
                    <div className="history-accordion-content">
                      
                      {/* INICIO EXACTO */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span className="text-muted" style={{ color: 'var(--text-muted, #94a3b8)' }}>Inicio exacto:</span>
                        <span style={{ fontWeight: '600', color: 'var(--text-main, #ffffff)' }}>
                          {startData.timeExact !== '--:--:--' ? `${startData.timeExact} hs` : startData.timeShort} {startData.date ? `(${startData.date})` : ''}
                        </span>
                      </div>

                      {/* FIN EXACTO O INDICADOR EN CURSO */}
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

                      {/* DURACIÓN TOTAL */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span className="text-muted" style={{ color: 'var(--text-muted, #94a3b8)' }}>Tiempo total:</span>
                        <span style={{ fontWeight: '600', color: 'var(--text-main, #ffffff)' }}>{durationText}</span>
                      </div>

                      {/* ORIGEN DE ORDEN */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span className="text-muted" style={{ color: 'var(--text-muted, #94a3b8)' }}>Origen de orden:</span>
                        <span style={{ fontWeight: '600', color: 'var(--primary, #10b981)' }}>{triggerText}</span>
                      </div>

                      {/* OBSERVACIONES / NOTAS */}
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
          </div>
        )}
      </div>
    </div>
  );
}