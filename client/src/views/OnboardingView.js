import React, { useState, useEffect } from 'react';

const getTodayDateString = () => {
  const d = new Date();
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().split('T')[0];
};

const getCurrentTimeRounded = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 5); 
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

const combineDateTime = (dateStr, timeStr) => {
  const safeTime = timeStr ? timeStr.substring(0, 5) : "00:00";
  return `${dateStr} ${safeTime}`;
};

export default function OnboardingView({ appData }) {
  const { 
    handleCreateSector, 
    newSector, 
    setNewSector, 
    newConfiguration, 
    setNewConfiguration 
  } = appData;

  const [sectorNameError, setSectorNameError] = useState('');
  const [sectorDateError, setSectorDateError] = useState('');
  const [sectorTimeError, setSectorTimeError] = useState('');

  // Al abrir el onboarding por primera vez, sugerimos fecha/hora actuales
  useEffect(() => {
    setNewConfiguration(prev => ({
      ...prev,
      startDate: getTodayDateString(),
      startTime: getCurrentTimeRounded(),
      durationMinutes: 15
    }));
  }, [setNewConfiguration]);

  const onSubmit = (e) => {
    e.preventDefault();
    let hasError = false;

    if (!newSector.name || !newSector.name.trim()) {
      setSectorNameError('Ingresa un nombre para el sector');
      hasError = true;
    } else {
      setSectorNameError('');
    }

    if (newSector.defaultConfiguration) {
      const startDate = newConfiguration.startDate || getTodayDateString();
      const startTime = newConfiguration.startTime;
      const todayStr = getTodayDateString();
      
      setSectorDateError('');
      setSectorTimeError('');

      if (!startDate) {
        setSectorDateError('Elige una fecha');
        hasError = true;
      }
      if (!startTime) {
        setSectorTimeError('Elige una hora');
        hasError = true;
      }

      if (startDate && startTime) {
        const fullTimeStr = combineDateTime(startDate, startTime);
        const routineTimestamp = new Date(fullTimeStr.replace(' ', 'T')).getTime();
        const now = new Date().getTime();

        if (routineTimestamp <= now) {
          if (startDate < todayStr) {
            setSectorDateError('La fecha ya pasó');
          } else {
            setSectorTimeError('La hora ya pasó');
          }
          hasError = true;
        }
      }
    }

    if (hasError) return;

    handleCreateSector(e, { 
      defaultConfiguration: newSector.defaultConfiguration, 
      createConfiguration: newSector.defaultConfiguration
    });
  };

  return (
    <div className="glass-panel">
      <style>{`
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
        .accordion-wrapper {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease;
          opacity: 0;
          overflow: hidden;
          margin-bottom: 24px;
        }
        .accordion-wrapper.expanded {
          grid-template-rows: 1fr;
          opacity: 1;
        }
        .accordion-content {
          min-height: 0;
          overflow: hidden;
        }
      `}</style>

      <div style={{ marginBottom: '24px' }}>
        <p className="eyebrow">Primer paso</p>
        <h2>Crea tu primer sector</h2>
        <p className="text-muted">Define tu espacio principal de riego.</p>
      </div>

      <form onSubmit={onSubmit}>
        
        <div className="input-group">
          <label>Nombre del sector</label>
          <input 
            type="text" 
            value={newSector.name} 
            onChange={(e) => {
              setNewSector(prev => ({ ...prev, name: e.target.value }));
              if (sectorNameError) setSectorNameError('');
            }} 
            placeholder="Ej. Patio Central" 
            className={sectorNameError ? 'input-error' : ''}
            style={{ transition: 'all 0.3s ease' }}
          />
          <div className={`error-message-wrapper ${sectorNameError ? 'show' : ''}`}>
            <div className="error-message-content">
              <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', fontWeight: '600', display: 'block' }}>
                {sectorNameError}
              </span>
            </div>
          </div>
        </div>
        
        <div className="input-group">
          <label>Descripción</label>
          <input 
            type="text" 
            value={newSector.description} 
            onChange={(e) => setNewSector(prev => ({ ...prev, description: e.target.value }))} 
            placeholder="Ej. Zona de macetas y césped" 
          />
        </div>

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

        <div className={`accordion-wrapper ${newSector.defaultConfiguration ? 'expanded' : ''}`}>
          <div className="accordion-content">
            <div className="glass-panel" style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', marginTop: '8px' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '16px' }}>Horario inicial</h3>
              
              <div className="input-group">
                <label>Fecha de inicio</label>
                <input 
                  type="date" 
                  value={newConfiguration.startDate || getTodayDateString()} 
                  onChange={(e) => {
                    setNewConfiguration(prev => ({ ...prev, startDate: e.target.value }));
                    if (sectorDateError) setSectorDateError('');
                  }}
                  className={sectorDateError ? 'input-error' : ''}
                  style={{ transition: 'all 0.3s ease' }}
                />
                <div className={`error-message-wrapper ${sectorDateError ? 'show' : ''}`}>
                  <div className="error-message-content">
                    <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', fontWeight: '600', display: 'block' }}>
                      {sectorDateError}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Hora</label>
                  <input 
                    type="time" 
                    value={newConfiguration.startTime} 
                    onChange={(e) => {
                      setNewConfiguration(prev => ({ ...prev, startTime: e.target.value }));
                      if (sectorTimeError) setSectorTimeError('');
                    }}
                    className={sectorTimeError ? 'input-error' : ''}
                    style={{ transition: 'all 0.3s ease' }}
                  />
                  <div className={`error-message-wrapper ${sectorTimeError ? 'show' : ''}`}>
                    <div className="error-message-content">
                      <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', fontWeight: '600', display: 'block' }}>
                        {sectorTimeError}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Minutos</label>
                  <input 
                    type="number" min="5" max="180" 
                    value={newConfiguration.durationMinutes} 
                    onChange={(e) => setNewConfiguration(prev => ({ ...prev, durationMinutes: e.target.value }))}
                  />
                </div>
              </div>

            </div>
          </div>
        </div>

        <button type="submit" className="btn-primary" style={{ marginTop: '4px' }}>
          {newSector.defaultConfiguration ? 'Crear sector y guardar rutina' : 'Crear sector limpio'}
        </button>
      </form>
    </div>
  );
}