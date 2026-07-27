import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
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
  
  // === 1. ESCUDO ANTI-REBOTE ===
  // Pausará las peticiones automáticas mientras damos órdenes manuales
  const pauseSyncRef = useRef(false);

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
    // Si el escudo está activo, bloqueamos la lectura para evitar parpadeos
    if (pauseSyncRef.current) return;

    try {
      const [sectorData, configData, historyData] = await Promise.all([
        getSectors(),
        getConfigurations(),
        getHistory(),
      ]);

      setSectors(sectorData);
      setConfigurations(configData);
      setHistory(historyData);
    } catch (error) {
      setMessage(error.message || 'No se pudo cargar la información');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    const intervalId = setInterval(() => {
      loadData(); 
    }, 3000);

    return () => clearInterval(intervalId);
  }, [loadData]);

  // === 2. EL CEREBRO DEL BOTÓN GIGANTE (Apagar / Prender Inteligente) ===
  const handleToggleMain = useCallback(async () => {
    // A. Revisamos el estado de la realidad (¿Hay algo prendido?)
    const activeSectors = sectors.filter(s => {
      const st = s.currentState || s.current_state || s.estado || s.status;
      return (st === true || st === 1 || st === '1' || ['ON', 'ACTIVE', 'ACTIVO', 'RUNNING', 'PRENDIDO', 'TRUE'].includes(String(st).trim().toUpperCase()));
    });

    const isTurningOff = activeSectors.length > 0;
    let targetSectors = [];
    let newStateString = '';

    // B. Definimos el Plan de Acción
    if (isTurningOff) {
      targetSectors = activeSectors; // Solo apagamos los que están gastando agua
      newStateString = 'INACTIVE';
      setMessage('Deteniendo riego...');
    } else {
      targetSectors = sectors.filter(s => s.enabled !== false); // Prendemos los habilitados
      if (targetSectors.length === 0) {
        setMessage('No hay sectores habilitados para encender');
        return;
      }
      newStateString = 'ACTIVE';
      setMessage('Iniciando riego manual...');
    }

    // C. Activamos el Escudo Anti-Rebote
    pauseSyncRef.current = true;
    setIsActive(!isTurningOff); // Damos feedback visual rápido en el estado general

    // D. Magia Visual Inmediata (Optimistic UI)
    setSectors(prevSectors => prevSectors.map(sector => {
      if (targetSectors.find(target => target.id === sector.id)) {
        return { ...sector, currentState: newStateString };
      }
      return sector;
    }));

    // E. Enviamos las órdenes físicas (usando tu nuevo Endpoint PATCH)
    try {
      const promises = targetSectors.map(sector => {
        return fetch(`http://localhost:8080/api/sectors/${sector.id}/state`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state: newStateString })
        });
      });

      // Esperamos que TODAS las peticiones se completen
      await Promise.all(promises);
      setMessage(isTurningOff ? 'Riego detenido manualmente' : 'Riego iniciado manualmente');

    } catch (error) {
      console.error("Error en Master Switch:", error);
      setMessage('Error al contactar con las válvulas');
    } finally {
      // F. Bajamos el escudo 4 segundos después (Tiempo suficiente para hardware y base de datos)
      setTimeout(() => {
        pauseSyncRef.current = false;
        loadData(); // Leemos la realidad final
      }, 4000);
    }
  }, [sectors, loadData]);

  const handleToggleSector = async (sector) => {
    const updatedStatus = !(sector.enabled !== false);
    
    const payload = {
      name: sector.name,
      description: sector.description,
      enabled: updatedStatus, 
      currentState: sector.currentState 
    };

    try {
      const response = await fetch(`http://localhost:8080/api/sectors/${sector.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setSectors(prevSectors => prevSectors.map(s => 
          s.id === sector.id ? { ...s, enabled: updatedStatus } : s
        ));
      }
    } catch (error) {
      console.error("Error al habilitar/deshabilitar el sector:", error);
    }
  };

  const handleToggleAllSectors = async (enableAll) => {
    const payload = sectors.map(sector => ({
      idSector: sector.id,
      enabled: enableAll
    }));

    setSectors(prevSectors => prevSectors.map(s => ({
      ...s, enabled: enableAll
    })));

    try {
      const response = await fetch('http://localhost:8080/api/sectors/list', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Error al actualizar los sectores');
      setMessage(enableAll ? 'Todos los sectores habilitados' : 'Sectores pausados');
    } catch (error) {
      console.error(error);
      loadData(); 
    }
  };

  const handleToggleAllConfigurations = async (sectorId, enableAll) => {
    const sectorConfigs = configurations.filter(c => c.sectorId === sectorId);
    if (sectorConfigs.length === 0) return;

    setConfigurations(prev => prev.map(c => 
      c.sectorId === sectorId ? { ...c, enabled: enableAll } : c
    ));

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
      const response = await fetch('http://localhost:8080/api/configurations/list', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Error al actualizar rutinas');
      setMessage(enableAll ? 'Todas las rutinas activadas' : 'Rutinas pausadas en este sector');
    } catch (error) {
      console.error(error);
      loadData(); 
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

      setMessage('Sector creado correctamente');
      await loadData();
    } catch (error) {
      setMessage(error.message || 'No se pudo crear el sector');
    }
  }, [loadData, newConfiguration, newSector]);

  const handleSaveConfigurationsBatch = useCallback(async (routinesArray) => {
    try {
      const response = await fetch('http://localhost:8080/api/configurations/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(routinesArray)
      });

      if (!response.ok) throw new Error('Error al guardar las rutinas');

      setMessage(routinesArray.length > 1 ? `${routinesArray.length} rutinas guardadas` : 'Rutina guardada');
      await loadData(); 
      return true;
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
      setConfigurations((prev) => prev.map((item) => (item.id === config.id ? updated : item)));
    } catch (error) {
      setMessage(error.message || 'No se pudo actualizar la rutina');
    }
  }, []);

  const handleUpdateRoutine = useCallback(async (id, payload) => {
    try {
      const updated = await updateConfiguration(id, payload);
      setConfigurations((prev) => prev.map((item) => (item.id === id ? updated : item)));
    } catch (error) {
      console.error('Error al actualizar la rutina:', error);
    }
  }, []);

  const handleDeleteConfiguration = useCallback(async (id) => {
    try {
      await deleteConfiguration(id);
      setConfigurations((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      setMessage(error.message || 'No se pudo eliminar la rutina');
    }
  }, []);

  const handleUpdateSector = useCallback(async (sectorId, payload) => {
    try {
      const sectorToUpdate = sectors.find(s => s.id === sectorId);
      if (!sectorToUpdate) return;

      const finalPayload = {
        name: payload.name || sectorToUpdate.name,
        description: sectorToUpdate.description,
        enabled: sectorToUpdate.enabled,
        currentState: sectorToUpdate.currentState
      };

      const response = await fetch(`http://localhost:8080/api/sectors/${sectorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalPayload)
      });

      if (response.ok) {
        setSectors(prevSectors => prevSectors.map(s => 
          s.id === sectorId ? { ...s, name: finalPayload.name } : s
        ));
      }
    } catch (error) {
      console.error("Error al actualizar el nombre del sector:", error);
    }
  }, [sectors]);

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
      handleUpdateSector
    }),
    [configurations, handleCreateSector, handleSaveConfigurationsBatch, handleToggleMain, handleToggleSector, history, isActive, loading, loadData, message, newConfiguration, newSector, sectors, handleToggleAllConfigurations, handleUpdateSector]
  );

  return value;
}