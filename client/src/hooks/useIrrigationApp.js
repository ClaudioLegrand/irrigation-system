import { useCallback, useEffect, useMemo, useState } from 'react';
import { createSector, getSectors, updateSector } from '../services/sectorService';
import { getHistory } from '../services/historyService';
import { createConfiguration, getConfigurations, updateConfiguration, deleteConfiguration } from '../services/configurationService';

export function useIrrigationApp() {
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
  const [newConfiguration, setNewConfiguration] = useState({
    startTime: '06:00',
    durationMinutes: 15,
    enabled: true,
  });

  const loadData = useCallback(async () => {
    try {
      const [sectorData, configData, historyData] = await Promise.all([
        getSectors(),
        getConfigurations(),
        getHistory(),
      ]);

      setSectors(sectorData);
      setConfigurations(configData);
      setHistory(historyData);
      // ELIMINAMOS la línea que encendía el botón maestro basándose en los sectores
    } catch (error) {
      setMessage(error.message || 'No se pudo cargar la información');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleMain = useCallback(async () => {
    const nextState = !isActive;
    setIsActive(nextState);
    // Cambiamos el mensaje para que quede claro que es una acción manual
    setMessage(nextState ? 'Riego manual iniciado' : 'Riego manual detenido');

    // ELIMINAMOS el bloque de código que modificaba todos los sectores.
    // El hardware ahora sabrá que debe regar los que ya están habilitados.
  }, [isActive]);

  const handleToggleSector = useCallback(async (sector) => {
    const nextState = sector.currentState === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const updated = await updateSector(sector.id, {
        ...sector,
        currentState: nextState,
        defaultConfiguration: false,
      });
      
      setSectors((prev) => prev.map((item) => (item.id === sector.id ? updated : item)));
      // ELIMINAMOS la línea que encendía el botón al habilitar un sector
    } catch (error) {
      setMessage(error.message || 'No se pudo cambiar el estado del sector');
    }
  }, []);

  const handleCreateSector = useCallback(async (event, options = {}) => {
    event.preventDefault();

    const name = newSector.name.trim();
    if (!name) {
      setMessage('Ingresa un nombre para crear el sector');

      window.scrollTo({ top: 0, behavior: 'smooth' });

      return;
    }

    const shouldCreateDefaultConfiguration = options.defaultConfiguration ?? Boolean(newSector.defaultConfiguration);
    const shouldCreateManualConfiguration = Boolean(options.createConfiguration);

    try {
      const created = await createSector({
        name,
        description: newSector.description.trim(),
        currentState: 'INACTIVE',
        defaultConfiguration: shouldCreateDefaultConfiguration,
      });

      setSectors((prev) => [created, ...prev]);
      setNewSector({ name: '', description: '', defaultConfiguration: true });

      if (shouldCreateManualConfiguration) {
        const createdConfiguration = await createConfiguration({
          sectorId: created.id,
          startTime: newConfiguration.startTime,
          durationMinutes: Number(newConfiguration.durationMinutes),
          enabled: Boolean(newConfiguration.enabled),
        });
        setConfigurations((prev) => [createdConfiguration, ...prev]);
      }

      setMessage(
        shouldCreateManualConfiguration
          ? 'Sector creado y configuración guardada'
          : shouldCreateDefaultConfiguration
            ? 'Sector creado y configuración predeterminada activada'
            : 'Sector creado correctamente'
      );
      await loadData();
    } catch (error) {
      setMessage(error.message || 'No se pudo crear el sector');
    }
  }, [loadData, newConfiguration, newSector]);

  const handleSaveConfiguration = useCallback(async (payload) => {
    try {
      const created = await createConfiguration(payload);
      setConfigurations((prev) => [created, ...prev]);
      setMessage('Configuración guardada correctamente');
    } catch (error) {
      setMessage(error.message || 'No se pudo guardar la configuración');
    }
  }, []);

  const handleToggleConfiguration = useCallback(async (config) => {
    try {
      const updated = await updateConfiguration(config.id, {
        ...config,
        enabled: !config.enabled
      });
      // Actualiza en tiempo real
      setConfigurations((prev) => prev.map((item) => (item.id === config.id ? updated : item)));
    } catch (error) {
      setMessage(error.message || 'No se pudo actualizar la rutina');
    }
  }, []);

  const handleDeleteConfiguration = useCallback(async (id) => {
    try {
      await deleteConfiguration(id);
      // Lo quitamos visualmente de la lista
      setConfigurations((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      setMessage(error.message || 'No se pudo eliminar la rutina');
    }
  }, []);

  const value = useMemo(
    () => ({
      sectors,
      configurations,
      history,
      isActive,
      loading,
      message,
      newSector,
      setNewSector,
      newConfiguration,
      setNewConfiguration,
      loadData,
      handleToggleMain,
      handleToggleSector,
      handleCreateSector,
      handleSaveConfiguration,
      handleToggleConfiguration,
      handleDeleteConfiguration,
    }),
    [configurations, handleCreateSector, handleSaveConfiguration, handleToggleMain, handleToggleSector, history, isActive, loading, loadData, message, newConfiguration, newSector, sectors]
  );

  return value;
}
