import React, { useState } from 'react';

export default function ConfigView({ appData }) {
  const { sectors, handleToggleSector, handleSaveConfiguration } = appData;
  const [formData, setFormData] = useState({
    sectorId: sectors[0]?.id || '',
    startTime: '06:00',
    durationMinutes: 15,
    enabled: true,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSaveConfiguration({
      sectorId: Number(formData.sectorId),
      startTime: formData.startTime,
      durationMinutes: Number(formData.durationMinutes),
      enabled: formData.enabled,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Lista de Sectores (Control individual) */}
      <div className="glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.1rem' }}>Sectores</h3>
          <span className="text-muted" style={{ fontSize: '0.9rem' }}>{sectors.length} activos</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {sectors.map(sector => (
            <div key={sector.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
              <div>
                <h4 style={{ fontSize: '1rem' }}>{sector.name}</h4>
                <p className="text-muted" style={{ fontSize: '0.85rem' }}>{sector.description || 'Sin descripción'}</p>
              </div>
              <button 
                onClick={() => handleToggleSector(sector)}
                style={{
                  background: sector.currentState === 'ACTIVE' ? 'var(--primary-glow)' : 'rgba(255,255,255,0.1)',
                  color: sector.currentState === 'ACTIVE' ? 'var(--primary)' : 'var(--text-muted)',
                  border: `1px solid ${sector.currentState === 'ACTIVE' ? 'var(--primary)' : 'transparent'}`,
                  padding: '8px 16px', borderRadius: '99px', cursor: 'pointer', fontWeight: 'bold'
                }}
              >
                {sector.currentState === 'ACTIVE' ? 'ON' : 'OFF'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Formulario de Nueva Configuración */}
      <div className="glass-panel">
        <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Nueva Programación</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Sector</label>
            <select value={formData.sectorId} onChange={(e) => setFormData({...formData, sectorId: e.target.value})}>
              {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="input-group">
              <label>Hora</label>
              <input type="time" value={formData.startTime} onChange={(e) => setFormData({...formData, startTime: e.target.value})} />
            </div>
            <div className="input-group">
              <label>Minutos</label>
              <input type="number" min="5" value={formData.durationMinutes} onChange={(e) => setFormData({...formData, durationMinutes: e.target.value})} />
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>Guardar rutina</button>
        </form>
      </div>
    </div>
  );
}