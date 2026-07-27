import React, { useState, useEffect } from 'react';

export default function DashboardView({ appData, setCurrentView }) {
const { isActive, handleToggleMain, sectors = [], configurations = [], history = [] } = appData;

// 1. ESTADO DE LOS SECTORES Y HARDWARE
const enabledSectors = sectors.filter(s => s.enabled !== false);

// Función robusta para verificar si un sector está físicamente prendido
const checkIsActive = (sector) => {
if (!sector) return false;
const st = sector.current_state || sector.currentState || sector.status || sector.state || sector.estado || sector.activo || sector.running;
return (st === true || st === 1 || st === '1' || ['ON', 'ACTIVE', 'ACTIVO', 'RUNNING', 'PRENDIDO', 'EJECUTANDO', 'IN_PROGRESS', 'TRUE'].includes(String(st).trim().toUpperCase()));
};

const activeSectors = sectors.filter(checkIsActive);
const activeCount = activeSectors.length;

// El sistema está regando si el usuario apretó el botón O si el hardware confirma sectores prendidos
const systemIsWatering = isActive || activeCount > 0;

// 2. MOTOR CRONOLÓGICO: CALCULAR EL PRÓXIMO RIEGO EXACTO
const getNextWateringEvents = () => {
if (configurations.length === 0) return [];

const now = new Date();
const currentMinutes = now.getHours() * 60 + now.getMinutes();

let upcomingConfigs = [];

configurations.forEach(config => {
// Ignorar rutinas apagadas o de sectores apagados
if (config.enabled === false) return;
const sector = sectors.find(s => s.id === config.sectorId);
if (!sector || sector.enabled === false) return;

// Extraer hora y minutos
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

// Si ya pasó hoy, es para mañana
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

// Ordenar de más cercano a más lejano
upcomingConfigs.sort((a, b) => a.diff - b.diff);

// Agrupar todos los que ocurren al mismo tiempo exacto (por si hay múltiples a la misma hora)
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
items = [{ id: 'wait', left: 'Conectando válvulas...', right: '...' }];
} else {
items = activeSectors.map(s => ({
    id: s.id,
    left: s.name,
    right: 'En curso'
}));
}
} else {
if (nextEvents.length === 0) {
items = [{ id: 'none', left: 'Sin rutinas programadas', right: '--:--' }];
} else {
const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
const isTomorrow = nextEvents[0].diff >= (24 * 60 - nowMins);
const dayStr = isTomorrow ? 'Mañana' : 'Hoy';

items = nextEvents.map((e, idx) => ({
    id: `next-${idx}`,
    left: e.sectorName,
    right: `${dayStr}, ${e.timeStr} hs`
}));
}
}

// Solo actualizar si realmente cambió la cantidad o el estado para evitar parpadeos
setTickerItems(items);
setTickerIndex(0);
}, [systemIsWatering, activeCount, nextEvents.length]); 

// Motor de rotación del carrusel (Cada 3.5s)
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

// 5. EXTRACCIÓN DEL ÚLTIMO EVENTO (Real y Ordenado)
const getLatestHistory = () => {
if (!history || history.length === 0) return null;

// Función para estandarizar cualquier fecha a milisegundos
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

// Ordenar forzosamente de más reciente a más antiguo
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

return (
// Reducimos el padding y gap para ganar espacio vertical y matar el scroll
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
.ticker-slide.active {
    opacity: 1;
    transform: translateY(0);
}
.ticker-slide.prev {
    opacity: 0;
    transform: translateY(-24px); /* Sube y desaparece */
}
.ticker-slide.next {
    opacity: 0;
    transform: translateY(24px); /* Entra desde abajo */
}

/* TEXTOS CON PROTECCIÓN ANTI-DESBORDES Y ANTI-JANK */
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

/* PROTECCIÓN PARA EL TEXTO DEL BOTÓN */
.hero-text-clamp {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
    padding: 0 10px;
    box-sizing: border-box;
}
`}</style>

{/* === 1. EL BOTÓN GIGANTE (PROPORCIONAL Y ESTABILIZADO) === */}
{/* 
Para eliminar el scroll y evitar que se haga ovalado:
1. width limitado (min entre 60vw o 220px).
2. aspect-ratio: 1 / 1 asegura que sea un círculo perfecto matemáticamente.
3. min-height previene que se achaste si el texto es muy corto.
*/}
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
        <span style={{ fontSize: '2.8rem', marginBottom: '8px', lineHeight: 1 }}>💧</span>
        <span style={{ fontSize: '1.2rem', fontWeight: '800' }}>APAGAR</span>
        <p className="hero-text-clamp" style={{ fontSize: '0.85rem', marginTop: '4px' }}>{heroSubtext}</p>
    </>
    ) : (
    <>
        <span style={{ fontSize: '2.8rem', marginBottom: '8px', lineHeight: 1, filter: 'grayscale(1)' }}>🌱</span>
        <span style={{ fontSize: '1.2rem', fontWeight: '800' }}>ENCENDER</span>
        <p className="hero-text-clamp" style={{ fontSize: '0.85rem', marginTop: '4px' }}>{heroSubtext}</p>
    </>
    )}
</button>
</div>

<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

{/* === 2. PANEL INTELIGENTE: PRÓXIMO RIEGO / EN PROCESO === */}
{/* Altura mínima asegurada (minHeight) para evitar saltos (Layout Shift) al animarse */}
<div 
    className="glass-panel" 
    style={{ 
    padding: '16px', 
    minHeight: '84px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    border: systemIsWatering ? '1px solid var(--primary)' : '1px solid var(--surface-border)',
    background: systemIsWatering ? 'rgba(16, 185, 129, 0.05)' : 'var(--surface)',
    transition: 'all 0.4s ease'
    }}
>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    {systemIsWatering ? (
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 6px rgba(16,185,129,0.8)' }}></span>
    ) : null}
    <p className="eyebrow" style={{ color: systemIsWatering ? 'var(--primary)' : 'var(--accent)', margin: 0 }}>
        {systemIsWatering ? 'En Proceso' : 'Próximo Riego'}
    </p>
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

{/* === 3. PANEL INTELIGENTE: ÚLTIMO EVENTO (Auditoría rápida) === */}
{/* MinHeight fijo para que el panel vacío o lleno mida siempre lo mismo */}
<div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', minHeight: '94px', boxSizing: 'border-box' }}>
    <p className="eyebrow" style={{ margin: 0 }}>Último Evento</p>
    
    {lastHistory ? (
    <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', gap: '16px' }}>
        <span style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
            {getHistorySectorName(lastHistory)}
        </span>
        <span style={{ fontSize: '0.90rem', fontWeight: '700', color: 'var(--text-muted)', flexShrink: 0 }}>
            {lastHistory.endDateTime ? 'Finalizado' : 'En curso'}
        </span>
        </div>

        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        Origen: <strong style={{ color: 'var(--text-main)' }}>{getHistoryOrigin(lastHistory)}</strong>
        </div>
    </>
    ) : (
    // ESTADO VACÍO ELEGANTE: Cuando la base de datos no tiene registros aún.
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', opacity: 0.6 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <span style={{ fontSize: '0.9rem' }}>Aún no hay actividad registrada</span>
    </div>
    )}
</div>

</div>
</div>
);
}