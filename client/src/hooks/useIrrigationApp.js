import { useCallback, useEffect, useMemo, useState } from 'react';
import { createConfiguration, getConfigurations } from '../services/configurationService';
import { createSector, getSectors, updateSector } from '../services/sectorService';
import { getHistory } from '../services/historyService';

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
      setIsActive(sectorData.some((sector) => sector.currentState === 'ACTIVE'));
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
  }, [isActive, sectors]);

  const handleToggleSector = useCallback(async (sector) => {
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
  }, []);

  const handleCreateSector = useCallback(async (event) => {
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
  }, [loadData, newSector]);

  const handleSaveConfiguration = useCallback(async (payload) => {
    try {
      const created = await createConfiguration(payload);
      setConfigurations((prev) => [created, ...prev]);
      setMessage('Configuración guardada correctamente');
    } catch (error) {
      setMessage(error.message || 'No se pudo guardar la configuración');
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
      loadData,
      handleToggleMain,
      handleToggleSector,
      handleCreateSector,
      handleSaveConfiguration,
    }),
    [configurations, handleCreateSector, handleSaveConfiguration, handleToggleMain, handleToggleSector, history, isActive, loading, loadData, message, newSector, sectors]
  );

  return value;
}
