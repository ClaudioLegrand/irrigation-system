import './App.css';
import AppHeader from './components/AppHeader';
import IrrigationControlCard from './components/IrrigationControlCard';
import SectorList from './components/SectorList';
import ConfigurationForm from './components/ConfigurationForm';
import HistoryList from './components/HistoryList';
import { useIrrigationApp } from './hooks/useIrrigationApp';

function App() {
  const {
    sectors,
    history,
    isActive,
    loading,
    message,
    newSector,
    setNewSector,
    handleToggleMain,
    handleToggleSector,
    handleCreateSector,
    handleSaveConfiguration,
  } = useIrrigationApp();

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
