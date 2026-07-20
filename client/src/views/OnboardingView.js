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

        <div className="glass-panel" style={{ padding: '16px', margin: '24px 0', background: 'rgba(0,0,0,0.2)' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '16px', color: 'var(--primary)' }}>Ajustes de riego inicial</h3>
          
          <div className="input-group">
            <label>Hora de inicio</label>
            <input 
              type="time" 
              value={newConfiguration.startTime} 
              onChange={(e) => setNewConfiguration(prev => ({ ...prev, startTime: e.target.value }))} 
            />
          </div>
          
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Duración (minutos)</label>
            <input 
              type="number" min="5" max="180" 
              value={newConfiguration.durationMinutes} 
              onChange={(e) => setNewConfiguration(prev => ({ ...prev, durationMinutes: e.target.value }))} 
            />
          </div>
        </div>

        <button type="submit" className="btn-primary">Guardar y comenzar</button>
      </form>
    </div>
  );
}