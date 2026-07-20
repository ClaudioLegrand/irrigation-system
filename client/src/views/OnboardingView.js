import React from 'react';

export default function OnboardingView({ appData }) {
  const { 
    handleCreateSector, 
    newSector, 
    setNewSector, 
    newConfiguration, 
    setNewConfiguration 
  } = appData;

  return (
    <div className="glass-panel">
      <div style={{ marginBottom: '24px' }}>
        <p className="eyebrow">Primer paso</p>
        <h2>Crea tu primer sector</h2>
        <p className="text-muted">Define tu espacio y establece una configuración base.</p>
      </div>

      <form onSubmit={(e) => handleCreateSector(e, { defaultConfiguration: false, createConfiguration: true })}>
        <div className="input-group">
          <label>Nombre del sector</label>
          <input 
            type="text" 
            value={newSector.name} 
            onChange={(e) => setNewSector(prev => ({ ...prev, name: e.target.value }))} 
            placeholder="Ej. Jardín delantero" 
          />
        </div>
        
        <div className="input-group">
          <label>Descripción</label>
          <input 
            type="text" 
            value={newSector.description} 
            onChange={(e) => setNewSector(prev => ({ ...prev, description: e.target.value }))} 
            placeholder="Ej. Césped y rosales" 
          />
        </div>

        {/* --- Switch 1: Configuración Predeterminada --- */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '24px 0 12px 0' }}>
          <div>
            <p style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.95rem' }}>Configuración por defecto</p>
            <p className="text-muted" style={{ fontSize: '0.8rem' }}>Usar la rutina base del sistema</p>
          </div>
          <button
            type="button"
            className={`switch-toggle ${newSector.defaultConfiguration ? 'is-on' : 'is-off'}`}
            onClick={() => setNewSector(prev => ({ ...prev, defaultConfiguration: !prev.defaultConfiguration }))}
          >
            <span className="switch-toggle__thumb" />
          </button>
        </div>

        {/* --- Bloque Manual (Se bloquea si el switch anterior está ON) --- */}
        <div 
          className={`glass-panel config-block ${newSector.defaultConfiguration ? 'is-disabled' : ''}`} 
          style={{ padding: '16px', marginBottom: '24px', background: 'rgba(0,0,0,0.2)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
             <h3 style={{ fontSize: '1rem', color: 'var(--primary)' }}>Ajustes de riego manual</h3>
             <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: newSector.defaultConfiguration ? 'var(--text-muted)' : 'var(--primary)' }}>
               {newSector.defaultConfiguration ? 'BLOQUEADO' : 'ACTIVO'}
             </span>
          </div>
          
          <div className="input-group">
            <label>Hora de inicio</label>
            <input 
              type="time" 
              value={newConfiguration.startTime} 
              onChange={(e) => setNewConfiguration(prev => ({ ...prev, startTime: e.target.value }))}
              disabled={newSector.defaultConfiguration} 
            />
          </div>
          
          <div className="input-group" style={{ marginBottom: '16px' }}>
            <label>Duración (minutos)</label>
            <input 
              type="number" min="5" max="180" 
              value={newConfiguration.durationMinutes} 
              onChange={(e) => setNewConfiguration(prev => ({ ...prev, durationMinutes: e.target.value }))}
              disabled={newSector.defaultConfiguration} 
            />
          </div>

          {/* --- Switch 2: Activar Configuración para el Hardware --- */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--surface-border)' }}>
            <div>
              <p style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.9rem' }}>Habilitar rutina</p>
              <p className="text-muted" style={{ fontSize: '0.8rem' }}>El hardware ejecutará este riego</p>
            </div>
            <button
              type="button"
              className={`switch-toggle ${newConfiguration.enabled ? 'is-on' : 'is-off'}`}
              onClick={() => setNewConfiguration(prev => ({ ...prev, enabled: !prev.enabled }))}
              disabled={newSector.defaultConfiguration}
            >
              <span className="switch-toggle__thumb" />
            </button>
          </div>
        </div>

        {/* Botón dinámico */}
        <button type="submit" className="btn-primary">
          {newSector.defaultConfiguration ? 'Crear sector' : 'Crear sector y guardar rutina'}
        </button>
      </form>
    </div>
  );
}