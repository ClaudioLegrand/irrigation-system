import React, { useState, useEffect } from 'react';

export default function DashboardView({ appData, setCurrentView }) {
const { isActive, handleToggleMain, sectors = [], configurations = [], history = [] } = appData;

// 1. ESTADO DE LOS SECTORES Y HARDWARE
const enabledSectors = sectors.filter(s => s.enabled !== false);

const checkIsActive = (sector) => {
    if (!sector) return false;
    const st = sector.current_state || sector.currentState || sector.status || sector.state || sector.estado || sector.activo || sector.running;
    return (st === true || st === 1 || st === '1' || ['ON', 'ACTIVE', 'ACTIVO', 'RUNNING', 'PRENDIDO', 'EJECUTANDO', 'IN_PROGRESS', 'TRUE'].includes(String(st).trim().toUpperCase()));
};

const activeSectors = sectors.filter(checkIsActive);
const activeCount = activeSectors.length;
const systemIsWatering = isActive || activeCount > 0;

// 2. MOTOR CRONOLÓGICO: CALCULAR EL PRÓXIMO RIEGO EXACTO
const getNextWateringEvents = () => {
    if (configurations.length === 0) return [];

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let upcomingConfigs = [];

    configurations.forEach(config => {
    if (config.enabled === false) return;
    const sector = sectors.find(s => s.id === config.sectorId);
    if (!sector || sector.enabled === false) return;

    let h = 0, m = 0;
    if (typeof config.startTime === 'string') {
        const parts = config.startTime.split(':');
        h = parseInt(parts[0], 10);
        m = parseInt(parts[1], 10);
    } else if (config.startTime && typeof config.startTime === 'object') {
        h = parseInt(config.startTime.hour || 0, 10);
        m = parseInt(config.startTime.minute || 0, 10);
    }

    const configMinutes = h * 60 + m;
    let diff = 0;

    if (configMinutes > currentMinutes) {
        diff = configMinutes - currentMinutes;
    } else {
        diff = (24 * 60 - currentMinutes) + configMinutes;
    }

    upcomingConfigs.push({
        ...config,
        sectorName: sector.name,
        diff,
        timeStr: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    });
    });

    if (upcomingConfigs.length === 0) return [];
    upcomingConfigs.sort((a, b) => a.diff - b.diff);
    const closestDiff = upcomingConfigs[0].diff;
    return upcomingConfigs.filter(c => c.diff === closestDiff);
};

const nextEvents = getNextWateringEvents();

// 3. GENERADOR DE CARRUSEL FLUIDO (TICKER)
const [tickerIndex, setTickerIndex] = useState(0);
const [tickerItems, setTickerItems] = useState([]);

useEffect(() => {
    let items = [];
    if (systemIsWatering) {
    if (activeCount === 0) {
        items = [{ id: 'wait', sectorId: null, left: 'Conectando válvulas...', right: '' }];
    } else {
        items = activeSectors.map(s => ({
        id: s.id,
        sectorId: s.id, // NUEVO: Guardamos el ID real para la navegación
        left: s.name,
        right: 'En curso'
        }));
    }
    } else {
    if (nextEvents.length === 0) {
        if (enabledSectors.length === 0) {
        items = [{ id: 'none', sectorId: null, left: 'Sectores en pausa', right: '' }];
        } else {
        items = [{ id: 'none', sectorId: null, left: 'Sin rutinas programadas', right: '' }];
        }
    } else {
        const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
        const isTomorrow = nextEvents[0].diff >= (24 * 60 - nowMins);
        const dayStr = isTomorrow ? 'Mañana' : 'Hoy';

        items = nextEvents.map((e, idx) => ({
        id: `next-${idx}`,
        sectorId: e.sectorId, // NUEVO: Guardamos el ID de la rutina
        left: e.sectorName,
        right: `${dayStr}, ${e.timeStr} hs`
        }));
    }
    }

    setTickerItems(items);
    setTickerIndex(0);
}, [systemIsWatering, activeCount, nextEvents.length, enabledSectors.length]); 

useEffect(() => {
    if (tickerItems.length <= 1) return;
    const interval = setInterval(() => {
    setTickerIndex(prev => (prev + 1) % tickerItems.length);
    }, 3500);
    return () => clearInterval(interval);
}, [tickerItems]);

// 4. TEXTOS DEL BOTÓN GIGANTE
let heroSubtext = '';
if (systemIsWatering) {
    if (activeCount === 0) heroSubtext = 'Iniciando sistema...';
    else if (activeCount === 1) heroSubtext = `Regando: ${activeSectors[0].name}`;
    else heroSubtext = `Regando: ${activeCount} zonas`;
} else {
    if (enabledSectors.length === 0) heroSubtext = 'Sin sectores habilitados';
    else if (enabledSectors.length === 1) heroSubtext = '1 zona lista';
    else heroSubtext = `${enabledSectors.length} zonas listas`;
}

// 5. HISTORIAL Y "UI OPTIMISTA"
const getLatestHistory = () => {
    if (!history || history.length === 0) return null;
    const parseToTimestamp = (val) => {
    if (!val) return 0;
    if (typeof val === 'number') return val < 100000000000 ? val * 1000 : val;
    if (typeof val === 'string') {
        const cleanStr = val.trim().replace(' ', 'T').split('.')[0];
        const d = new Date(cleanStr);
        return isNaN(d.getTime()) ? 0 : d.getTime();
    }
    return 0;
    };
    const sortedHistory = [...history].filter(item => item !== null && typeof item === 'object').sort((a, b) => {
    const tA = parseToTimestamp(a.start_date_time || a.startDateTime || a.startTime || a.start_time || a.timestamp || a.created_at || a.createdAt);
    const tB = parseToTimestamp(b.start_date_time || b.startDateTime || b.startTime || b.start_time || b.timestamp || b.created_at || b.createdAt);
    return tB - tA;
    });
    return sortedHistory.length > 0 ? sortedHistory[0] : null;
};

const lastHistory = getLatestHistory();

const getHistoryOrigin = (item) => {
    if (!item) return 'Manual';
    const trigger = item.origin_order || item.originOrder || item.triggerSource || 'MANUAL_APP';
    const lower = String(trigger).toLowerCase();
    if (lower.includes('schedul') || lower.includes('routin') || lower.includes('auto')) return 'Automático';
    if (lower.includes('hard') || lower.includes('button') || lower.includes('fisi')) return 'Físico';
    return 'Manual';
};

const getHistorySectorName = (item) => {
    if (!item) return 'Desconocido';
    if (item.sectorName) return item.sectorName;
    const s = sectors.find(sec => String(sec.id) === String(item.sectorId || item.sector_id));
    return s ? s.name : 'Sector';
};

const formatEventTime = (item) => {
    if (!item) return '';
    const isEnd = !!(item.endDateTime || item.end_date_time);
    const rawDate = isEnd ? (item.endDateTime || item.end_date_time) : (item.startDateTime || item.start_date_time || item.start_time || item.startTime);
    if (!rawDate) return '';
    
    const cleanStr = typeof rawDate === 'string' ? rawDate.trim().replace(' ', 'T').split('.')[0] : rawDate;
    const d = new Date(cleanStr);
    if (isNaN(d.getTime())) return '';

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const eventDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    const timeStr = `${h}:${m} hs`;

    let dayStr = '';
    if (eventDate.getTime() === today.getTime()) dayStr = 'Hoy';
    else if (eventDate.getTime() === yesterday.getTime()) dayStr = 'Ayer';
    else {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    dayStr = `${day}/${month}/${d.getFullYear()}`;
    }

    const verb = isEnd ? 'Finalizó' : 'Inició';
    return `${verb}: ${dayStr}, ${timeStr}`;
};

// LÓGICA DE UI OPTIMISTA PARA EL ÚLTIMO EVENTO (AHORA BIDIRECCIONAL)
let displayFinished = false;
let displayTimeText = '';
let displayOrigin = '';
let displaySectorName = '';
let hasActivity = false;

if (systemIsWatering && activeCount > 0) {
    // CASO 1: EL SISTEMA ACABA DE ENCENDERSE
    const isDbHistoryFinished = lastHistory && (lastHistory.endDateTime || lastHistory.end_date_time);
    
    hasActivity = true;
    displayFinished = false;

    if (!lastHistory || isDbHistoryFinished) {
    // LAG DE ENCENDIDO: La BD aún manda un evento viejo/terminado. Inventamos el nuevo al instante.
    displaySectorName = activeSectors[0].name;
    displayOrigin = 'Manual';
    
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    displayTimeText = `Inició: Hoy, ${h}:${m} hs`;
    } else {
    // NORMAL: Ya llegó el evento real de la BD
    displaySectorName = getHistorySectorName(lastHistory);
    displayOrigin = getHistoryOrigin(lastHistory);
    displayTimeText = formatEventTime(lastHistory);
    }
} else if (lastHistory) {
    // CASO 2: EL SISTEMA ESTÁ APAGADO (Y tenemos historial)
    hasActivity = true;
    const isActuallyFinished = lastHistory.endDateTime || lastHistory.end_date_time;
    
    displaySectorName = getHistorySectorName(lastHistory);
    displayOrigin = getHistoryOrigin(lastHistory);
    
    if (!isActuallyFinished && !systemIsWatering) {
    // LAG DE APAGADO: La BD dice que sigue regando, pero sabemos que se apagó.
    displayFinished = true;
    displayTimeText = 'Finalizó: Completado';
    } else {
    // NORMAL: Todo sincronizado.
    displayFinished = isActuallyFinished;
    displayTimeText = formatEventTime(lastHistory);
    }
}

// 6. FUNCIONES DE NAVEGACIÓN CONTEXTUAL
const handleTickerClick = () => {
    if (tickerItems.length === 0) return;
    const currentItem = tickerItems[tickerIndex];
    if (currentItem && currentItem.sectorId && appData.setLastSectorId) {
    appData.setLastSectorId(currentItem.sectorId); // Memorizamos el sector
    }
    setCurrentView('config'); // Vamos a la vista de configuración
};

const handleLastEventClick = () => {
    setCurrentView('history'); // Vamos directo al historial
};

return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%', paddingBottom: '4px', overflow: 'hidden' }}>

    <style>{`
        /* ANIMACIÓN FLUIDA DEL CARRUSEL (SLIDE UP) */
        .ticker-wrapper {
        position: relative;
        width: 100%;
        height: 24px;
        overflow: hidden;
        margin-top: 6px;
        }
        .ticker-slide {
        position: absolute;
        top: 0; left: 0; width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.5s ease;
        }
        .ticker-slide.active { opacity: 1; transform: translateY(0); }
        .ticker-slide.prev { opacity: 0; transform: translateY(-24px); }
        .ticker-slide.next { opacity: 0; transform: translateY(24px); }

        .ticker-left {
        font-size: 1.05rem;
        font-weight: 600;
        color: var(--text-main);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex: 1;
        }
        .ticker-right {
        font-size: 0.95rem;
        font-weight: 700;
        flex-shrink: 0;
        }

        .hero-text-clamp {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        width: 100%;
        padding: 0 10px;
        box-sizing: border-box;
        }

        /* NUEVO: ESTILOS DE PANELES INTERACTIVOS */
        .interactive-panel {
        cursor: pointer;
        transition: transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1), background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease !important;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
        }
        .interactive-panel:hover {
        background: rgba(255, 255, 255, 0.05);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }
        .interactive-panel:active {
        transform: scale(0.97) !important;
        background: rgba(255, 255, 255, 0.08) !important;
        }
    `}</style>

    {/* === 1. EL BOTÓN GIGANTE === */}
    <div style={{ display: 'flex', justifyContent: 'center', flexShrink: 0, marginTop: '5px' }}>
        <button 
        className={`hero-button ${systemIsWatering ? 'active' : 'inactive'}`}
        onClick={handleToggleMain}
        style={{
            width: 'min(62vw, 220px)',
            aspectRatio: '1 / 1',
            borderRadius: '50%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '10px',
            boxSizing: 'border-box',
            transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}
        >
        {systemIsWatering ? (
            <>
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px' }}>
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
            </svg>
            <span style={{ fontSize: '1.2rem', fontWeight: '800' }}>APAGAR</span>
            <p className="hero-text-clamp" style={{ fontSize: '0.85rem', marginTop: '4px' }}>{heroSubtext}</p>
            </>
        ) : (
            <>
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px', opacity: 0.8 }}>
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path>
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path>
            </svg>
            <span style={{ fontSize: '1.2rem', fontWeight: '800' }}>ENCENDER</span>
            <p className="hero-text-clamp" style={{ fontSize: '0.85rem', marginTop: '4px' }}>{heroSubtext}</p>
            </>
        )}
        </button>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* === 2. PANEL INTELIGENTE: PRÓXIMO RIEGO / EN PROCESO (AHORA CLICKABLE) === */}
        <div 
        className="glass-panel interactive-panel" 
        onClick={handleTickerClick}
        style={{ padding: '16px', minHeight: '84px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center', border: systemIsWatering ? '1px solid var(--primary)' : '1px solid var(--surface-border)', background: systemIsWatering ? 'rgba(16, 185, 129, 0.05)' : 'var(--surface)', transition: 'all 0.4s ease' }}
        >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {systemIsWatering ? <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 6px rgba(16,185,129,0.8)' }}></span> : null}
            <p className="eyebrow" style={{ color: systemIsWatering ? 'var(--primary)' : 'var(--accent)', margin: 0 }}>
                {systemIsWatering ? 'En Proceso' : 'Próximo Riego'}
            </p>
            </div>
            
            {/* Pequeña flecha sutil para indicar que es clickeable */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
            <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
        </div>

        <div className="ticker-wrapper">
            {tickerItems.map((item, index) => {
            let className = "ticker-slide";
            if (index === tickerIndex) className += " active";
            else if (index === (tickerIndex - 1 + tickerItems.length) % tickerItems.length) className += " prev";
            else className += " next";

            return (
                <div key={item.id + index} className={className}>
                <span className="ticker-left" title={item.left}>{item.left}</span>
                <span className="ticker-right" style={{ color: systemIsWatering ? 'var(--primary)' : 'var(--text-muted)' }}>
                    {item.right}
                </span>
                </div>
            );
            })}
        </div>
        </div>

        {/* === 3. PANEL INTELIGENTE: ÚLTIMO EVENTO (AHORA CLICKABLE Y OPTIMISTA) === */}
        <div 
        className="glass-panel interactive-panel" 
        onClick={handleLastEventClick}
        style={{ padding: '16px', display: 'flex', flexDirection: 'column', minHeight: '106px', boxSizing: 'border-box' }}
        >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p className="eyebrow" style={{ margin: 0 }}>Último Evento</p>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
            <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
        </div>
        
        {hasActivity ? (
            <>
            {/* FILA 1: Nombre y Estado (Aplica lógica optimista bidireccional) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', gap: '16px' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                {displaySectorName}
                </span>
                <span style={{ fontSize: '0.80rem', fontWeight: '800', color: displayFinished ? 'var(--text-muted)' : 'var(--primary)', flexShrink: 0, padding: '4px 10px', borderRadius: '12px', background: displayFinished ? 'rgba(255,255,255,0.06)' : 'rgba(16,185,129,0.12)' }}>
                {displayFinished ? 'FINALIZADO' : 'EN CURSO'}
                </span>
            </div>

            {/* FILA 2 & 3: Fecha inteligente y Origen */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>{displayTimeText}</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
                <span>Origen: <strong style={{ color: 'var(--text-main)' }}>{displayOrigin}</strong></span>
                </div>

            </div>
            </>
        ) : (
            // ESTADO VACÍO ELEGANTE
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px', opacity: 0.6 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span style={{ fontSize: '0.9rem' }}>Aún no hay actividad registrada</span>
            </div>
        )}
        </div>

    </div>
    </div>
);
}