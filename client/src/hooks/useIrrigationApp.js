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
    // 1. Hace la primera carga inmediatamente al abrir la app
    loadData();

    // 2. Crea el ciclo que le pregunta a tu backend cada 3 segundos (3000ms)
    const intervalId = setInterval(() => {
      loadData(); 
    }, 3000);

    // 3. Limpieza del intervalo si cierras la app o cambias de vista
    return () => clearInterval(intervalId);
  }, [loadData]);

  const handleToggleMain = useCallback(async () => {
    const nextState = !isActive;
    setIsActive(nextState);
    // Cambiamos el mensaje para que quede claro que es una acción manual
    setMessage(nextState ? 'Riego manual iniciado' : 'Riego manual detenido');

    // ELIMINAMOS el bloque de código que modificaba todos los sectores.
    // El hardware ahora sabrá que debe regar los que ya están habilitados.
  }, [isActive]);

  const handleToggleSector = async (sector) => {
    // 1. Invertimos el valor de 'enabled'
    const currentStatus = sector.enabled !== false;
    
    // 2. Lo invertimos correctamente
    const updatedStatus = !currentStatus;
    
    const payload = {
      name: sector.name,
      description: sector.description,
      enabled: updatedStatus,           // NUNCA MÁS ENVIARÁ NULL
      currentState: sector.currentState 
    };

    try {
      // 3. Enviamos el PUT al backend
      const response = await fetch(`http://localhost:8080/api/sectors/${sector.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        // 4. Actualizamos el estado de React localmente
        setSectors(prevSectors => prevSectors.map(s => 
          s.id === sector.id ? { ...s, enabled: updatedStatus } : s
        ));
      }
    } catch (error) {
      console.error("Error al habilitar/deshabilitar el sector:", error);
    }
  };

  const handleToggleAllSectors = async (enableAll) => {
    // 1. Armamos el paquete de datos
    const payload = sectors.map(sector => ({
      idSector: sector.id,
      enabled: enableAll
    }));

    // 2. Actualizamos la UI inmediatamente para que se sienta súper rápido (Optimistic UI)
    setSectors(prevSectors => prevSectors.map(s => ({
      ...s,
      enabled: enableAll
    })));

    try {
      // 3. Enviamos la lista completa al backend
      // (Si usas un archivo sectorService.js, puedes abstraer este fetch allí luego)
      const response = await fetch('http://localhost:8080/api/sectors/list', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Error al actualizar los sectores');
      }
      
      setMessage(enableAll ? 'Todos los sectores habilitados' : 'Riego automático pausado en todos los sectores');
    } catch (error) {
      console.error(error);
      setMessage('Error de conexión al modificar sectores');
      // Si falla, recargamos los datos reales para deshacer el cambio visual
      loadData(); 
    }
  };

  // Agrégalo cerca de handleToggleAllSectors
  const handleToggleAllConfigurations = async (sectorId, enableAll) => {
    // 1. Buscamos todas las rutinas que pertenecen al sector seleccionado
    const sectorConfigs = configurations.filter(c => c.sectorId === sectorId);
    if (sectorConfigs.length === 0) return;

    // 2. Optimistic UI: Actualizamos la pantalla instantáneamente
    setConfigurations(prev => prev.map(c => 
      c.sectorId === sectorId ? { ...c, enabled: enableAll } : c
    ));

    // 3. Formateamos el payload tal como lo espera tu DTO en Java
    const payload = sectorConfigs.map(c => {
      let timeStr = c.startTime;
      if (typeof timeStr !== 'string') {
        const h = String(timeStr?.hour || 0).padStart(2, '0');
        const m = String(timeStr?.minute || 0).padStart(2, '0');
        timeStr = `${h}:${m}`;
      }
      return {
        sectorId: c.sectorId,
        startTime: timeStr,
        durationMinutes: Number(c.durationMinutes),
        enabled: enableAll
      };
    });

    try {
      // 4. Enviamos el PUT masivo a tu endpoint en Java
      const response = await fetch('http://localhost:8080/api/configurations/list', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Error al actualizar las rutinas');
      }

      setMessage(enableAll ? 'Todas las rutinas activadas' : 'Rutinas pausadas en este sector');
    } catch (error) {
      console.error(error);
      setMessage('Error de conexión al modificar rutinas');
      loadData(); // Revertimos los cambios visuales si falla el servidor
    }
  };

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

  const handleSaveConfigurationsBatch = useCallback(async (routinesArray) => {
    // routinesArray es una lista con formato: [{ sectorId, startTime, durationMinutes, enabled }, ...]
    try {
      // 1. Enviamos la lista al backend usando tu nuevo endpoint "list"
      const response = await fetch('http://localhost:8080/api/configurations/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(routinesArray)
      });

      if (!response.ok) {
        throw new Error('Error al guardar las rutinas');
      }

      // 2. Si el backend responde OK (200), refrescamos los datos visuales
      setMessage(routinesArray.length > 1 ? `${routinesArray.length} rutinas guardadas` : 'Rutina guardada');
      await loadData(); 
      
      return true; // Retornamos true para avisarle al formulario que puede limpiarse
    } catch (error) {
      console.error(error);
      setMessage(error.message || 'Error al guardar las rutinas');
      return false;
    }
  }, [loadData]);

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

  const handleUpdateRoutine = useCallback(async (id, payload) => {
    try {
      const updated = await updateConfiguration(id, payload);
      // Actualizamos la rutina en la pantalla instantáneamente
      setConfigurations((prev) => prev.map((item) => (item.id === id ? updated : item)));
    } catch (error) {
      console.error('Error al actualizar la rutina:', error);
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
      handleSaveConfigurationsBatch,
      handleToggleConfiguration,
      handleDeleteConfiguration,
      handleUpdateRoutine,
      handleToggleAllSectors,
      handleToggleAllConfigurations,
    }),
    [configurations, handleCreateSector, handleSaveConfigurationsBatch, handleToggleMain, handleToggleSector, history, isActive, loading, loadData, message, newConfiguration, newSector, sectors, handleToggleAllConfigurations]
  );

  return value;
}
