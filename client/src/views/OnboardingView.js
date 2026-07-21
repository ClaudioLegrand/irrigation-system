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
        <p className="text-muted">Define tu espacio principal de riego.</p>
      </div>

      <form onSubmit={(e) => handleCreateSector(e, { 
        defaultConfiguration: newSector.defaultConfiguration, 
        createConfiguration: newSector.defaultConfiguration // Solo la crea si el switch está ON
      })}>
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

        {/* --- Switch para elegir si quiere rutina o no --- */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '24px 0 16px 0', borderTop: '1px solid var(--surface-border)', paddingTop: '16px' }}>
          <div>
            <p style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.95rem' }}>Añadir rutina inicial</p>
            <p className="text-muted" style={{ fontSize: '0.8rem' }}>Programar un horario por defecto</p>
          </div>
          <button
            type="button"
            className={`switch-toggle ${newSector.defaultConfiguration ? 'is-on' : 'is-off'}`}
            onClick={() => setNewSector(prev => ({ ...prev, defaultConfiguration: !prev.defaultConfiguration }))}
          >
            <span className="switch-toggle__thumb" />
          </button>
        </div>

        {/* --- Solo mostramos la hora si el switch está activado --- */}
        {newSector.defaultConfiguration && (
          <div className="glass-panel" style={{ padding: '16px', marginBottom: '24px', background: 'rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '16px' }}>Horario inicial</h3>
            
            <div className="input-group">
              <label>Hora de inicio</label>
              <input 
                type="time" 
                value={newConfiguration.startTime} 
                onChange={(e) => setNewConfiguration(prev => ({ ...prev, startTime: e.target.value }))}
                required={newSector.defaultConfiguration} 
              />
            </div>
            
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Duración (minutos)</label>
              <input 
                type="number" min="5" max="180" 
                value={newConfiguration.durationMinutes} 
                onChange={(e) => setNewConfiguration(prev => ({ ...prev, durationMinutes: e.target.value }))}
                required={newSector.defaultConfiguration} 
              />
            </div>
          </div>
        )}

        <button type="submit" className="btn-primary" style={{ marginTop: '16px' }}>
          {newSector.defaultConfiguration ? 'Crear sector y guardar rutina' : 'Crear sector limpio'}
        </button>
      </form>
    </div>
  );
}