import { useEffect, useState } from 'react';
import './App.css';
import AppHeader from './components/AppHeader';
import IrrigationControlCard from './components/IrrigationControlCard';
import SectorList from './components/SectorList';
import ConfigurationForm from './components/ConfigurationForm';
import HistoryList from './components/HistoryList';
import { createConfiguration, createSector, getConfigurations, getHistory, getSectors, updateSector } from './services/api';

function App() {
  const [sectors, setSectors] = useState([]);
  const [configurations, setConfigurations] = useState([]);
  const [history, setHistory] = useState([]);
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [newSector, setNewSector] = useState({
    name: '',
    description: '',
    defaultConfiguration: true,
  });

  const loadData = async () => {
    try {
      const [sectorData, configData, historyData] = await Promise.all([
        getSectors(),
        getConfigurations(),
        getHistory(),
      ]);

      setSectors(sectorData);
      setConfigurations(configData);
      setHistory(historyData);
      setIsActive(sectorData.some((sector) => sector.currentState === 'ACTIVE'));
    } catch (error) {
      setMessage(error.message || 'No se pudo cargar la información');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleMain = async () => {
    const nextState = !isActive;
    setIsActive(nextState);
    setMessage(nextState ? 'Riego activado' : 'Riego detenido');

    try {
      await Promise.all(
        sectors.map((sector) =>
          updateSector(sector.id, {
            ...sector,
            currentState: nextState ? 'ACTIVE' : 'INACTIVE',
          })
        )
      );
    } catch (error) {
      setMessage(error.message || 'No se pudo actualizar el estado');
    }
  };

  const handleToggleSector = async (sector) => {
    const nextState = sector.currentState === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const updated = await updateSector(sector.id, {
        ...sector,
        currentState: nextState,
        defaultConfiguration: false,
      });
      setSectors((prev) => prev.map((item) => (item.id === sector.id ? updated : item)));
      setMessage(`Sector ${sector.name} ${nextState === 'ACTIVE' ? 'activado' : 'apagado'}`);
    } catch (error) {
      setMessage(error.message || 'No se pudo cambiar el estado del sector');
    }
  };

  const handleCreateSector = async (event) => {
    event.preventDefault();

    const name = newSector.name.trim();
    if (!name) {
      setMessage('Ingresa un nombre para crear el sector');
      return;
    }

    try {
      const created = await createSector({
        name,
        description: newSector.description.trim(),
        currentState: 'INACTIVE',
        defaultConfiguration: Boolean(newSector.defaultConfiguration),
      });

      setSectors((prev) => [created, ...prev]);
      setNewSector({ name: '', description: '', defaultConfiguration: true });
      setMessage(
        newSector.defaultConfiguration
          ? 'Sector creado y configuración predeterminada activada'
          : 'Sector creado correctamente'
      );
      await loadData();
    } catch (error) {
      setMessage(error.message || 'No se pudo crear el sector');
    }
  };

  const handleSaveConfiguration = async (payload) => {
    try {
      const created = await createConfiguration(payload);
      setConfigurations((prev) => [created, ...prev]);
      setMessage('Configuración guardada correctamente');
    } catch (error) {
      setMessage(error.message || 'No se pudo guardar la configuración');
    }
  };

  return (
    <div className="app-shell">
      <AppHeader title="Sistema de riego" subtitle="Controla tu riego desde tu celular" status={isActive ? 'Activo' : 'Inactivo'} />

      {message ? <div className="feedback-banner">{message}</div> : null}
      {loading ? <p className="loading">Cargando datos...</p> : null}

      <main className="app-content">
        <IrrigationControlCard isActive={isActive} onToggle={handleToggleMain} />

        {!loading && sectors.length === 0 ? (
          <section className="welcome-card">
            <div className="welcome-card__header">
              <p className="eyebrow">Primer uso</p>
              <h2>Crea tu primer sector</h2>
              <p>Comienza con un sector listo para regar y una configuración predeterminada.</p>
            </div>

            <form className="welcome-form" onSubmit={handleCreateSector}>
              <label>
                Nombre del sector
                <input
                  type="text"
                  value={newSector.name}
                  onChange={(event) => setNewSector((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Jardín principal"
                />
              </label>

              <label>
                Descripción
                <input
                  type="text"
                  value={newSector.description}
                  onChange={(event) => setNewSector((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Zona norte del jardín"
                />
              </label>

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={newSector.defaultConfiguration}
                  onChange={(event) => setNewSector((prev) => ({ ...prev, defaultConfiguration: event.target.checked }))}
                />
                Crear configuración predeterminada
              </label>

              <button type="submit" className="main-button start full-width">
                Guardar sector y configuración
              </button>
            </form>
          </section>
        ) : null}

        {sectors.length > 0 ? (
          <>
            <SectorList sectors={sectors} onToggleSector={handleToggleSector} />
            <ConfigurationForm sectors={sectors} onSave={handleSaveConfiguration} />
            <HistoryList historyItems={history} />
          </>
        ) : null}
      </main>
    </div>
  );
}

export default App;
