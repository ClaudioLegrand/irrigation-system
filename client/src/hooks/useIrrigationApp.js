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
  const pauseSyncRef = useRef(false);

  const [newSector, setNewSector] = useState({
    name: '',
    description: '',
    defaultConfiguration: true,
  });
  const [newConfiguration, setNewConfiguration] = useState({
    startDate: '', 
    startTime: '',
    durationMinutes: 15,
    enabled: true,
  });

  // === NUEVO: EL VIGILANTE SILENCIOSO ===
  useEffect(() => {
    if (!sectors || sectors.length === 0) return;
    
    const isAnyWatering = sectors.some(s => {
      const st = s.currentState || s.current_state || s.estado || s.status;
      return (st === true || st === 1 || st === '1' || ['ACTIVE', 'ACTIVO', 'RUNNING', 'PRENDIDO', 'TRUE', 'ON'].includes(String(st).trim().toUpperCase()));
    });

    if (!isAnyWatering && isActive) {
      setIsActive(false); 
    }
  }, [sectors, isActive]);

  const loadData = useCallback(async () => {
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
    const intervalId = setInterval(() => { loadData(); }, 3000);
    return () => clearInterval(intervalId);
  }, [loadData]);

  // === EL CEREBRO DEL BOTÓN GIGANTE ===
  const handleToggleMain = useCallback(async () => {
    const activeSectors = sectors.filter(s => {
      const st = s.currentState || s.current_state || s.estado || s.status;
      return (st === true || st === 1 || st === '1' || ['ACTIVE', 'ACTIVO', 'RUNNING', 'PRENDIDO', 'TRUE', 'ON'].includes(String(st).trim().toUpperCase()));
    });

    const isTurningOff = activeSectors.length > 0;
    let targetSectors = [];
    let newStateString = '';

    if (isTurningOff) {
      targetSectors = activeSectors; 
      newStateString = 'INACTIVE';
      setMessage('Deteniendo riego...');
    } else {
      targetSectors = sectors.filter(s => s.enabled !== false);
      if (targetSectors.length === 0) {
        setMessage('No hay sectores habilitados para encender');
        return;
      }
      newStateString = 'ACTIVE'; 
      setMessage('Iniciando riego manual...');
    }

    pauseSyncRef.current = true;
    setIsActive(!isTurningOff); 

    setSectors(prevSectors => prevSectors.map(sector => {
      if (targetSectors.find(target => target.id === sector.id)) {
        return { ...sector, currentState: newStateString };
      }
      return sector;
    }));

    try {
      const promises = targetSectors.map(sector => {
        return fetch(`http://localhost:8080/api/sectors/${sector.id}/state`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state: newStateString })
        }).then(async (res) => {
          if (!res.ok) {
            console.error(`Error del Backend en Botón Gigante (Sector ${sector.id}):`, await res.text());
            throw new Error(`Fallo en sector ${sector.id}`);
          }
          return res;
        });
      });

      await Promise.all(promises);
      setMessage(isTurningOff ? 'Riego detenido manualmente' : 'Riego iniciado manualmente');

    } catch (error) {
      console.error("Error al ejecutar acción maestro:", error);
      setMessage('Error al contactar con el servidor');
    } finally {
      setTimeout(() => {
        pauseSyncRef.current = false;
        loadData(); 
      }, 4000);
    }
  }, [sectors, loadData]);

  // === COMBO DE 2 GOLPES (PARO DE EMERGENCIA SECUENCIAL) ===
  const handleToggleSector = async (sector) => {
    const updatedStatus = !(sector.enabled !== false);
    
    const st = sector.currentState || sector.current_state || sector.estado || sector.status;
    const isCurrentlyWatering = (st === true || st === 1 || st === '1' || ['ON', 'ACTIVE', 'ACTIVO', 'RUNNING', 'PRENDIDO', 'TRUE'].includes(String(st).trim().toUpperCase()));
    
    const needsEmergencyStop = !updatedStatus && isCurrentlyWatering;

    const payload = {
      name: sector.name || `Sector ${sector.id}`,
      description: sector.description || "",
      defaultConfiguration: false,
      currentState: needsEmergencyStop ? 'INACTIVE' : (sector.currentState || "INACTIVE"),
      enabled: updatedStatus
    };

    pauseSyncRef.current = true;

    setSectors(prevSectors => prevSectors.map(s => {
      if (s.id === sector.id) {
        return { ...s, enabled: updatedStatus, currentState: payload.currentState };
      }
      return s;
    }));

    if (needsEmergencyStop) setMessage('Sector pausado: Cortando el agua por seguridad...');

    try {
      if (needsEmergencyStop) {
        const patchRes = await fetch(`http://localhost:8080/api/sectors/${sector.id}/state`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state: 'INACTIVE' })
        });
        if (!patchRes.ok) console.error("Fallo el PATCH de Emergencia:", await patchRes.text());
      }

      const putRes = await fetch(`http://localhost:8080/api/sectors/${sector.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!putRes.ok) console.error("Fallo el PUT de Configuración:", await putRes.text());

    } catch (error) {
      console.error("Error crítico al modificar sector:", error);
    } finally {
      setTimeout(() => {
        pauseSyncRef.current = false;
        loadData();
      }, 4000);
    }
  };

  const handleToggleAllSectors = async (enableAll) => {
    pauseSyncRef.current = true; 

    const activeSectors = sectors.filter(s => {
      const st = s.currentState || s.current_state || s.estado || s.status;
      return (st === true || st === 1 || st === '1' || ['ON', 'ACTIVE', 'ACTIVO', 'RUNNING', 'PRENDIDO', 'TRUE'].includes(String(st).trim().toUpperCase()));
    });

    const needsEmergencyStop = !enableAll && activeSectors.length > 0;

    if (needsEmergencyStop) setMessage('Pausando todos los sectores y cortando el agua...');
    else setMessage(enableAll ? 'Habilitando todos los sectores...' : 'Pausando sectores...');

    setSectors(prevSectors => prevSectors.map(s => ({
      ...s, 
      enabled: enableAll,
      currentState: (!enableAll && activeSectors.find(active => active.id === s.id)) ? 'INACTIVE' : s.currentState
    })));

    try {
      if (needsEmergencyStop) {
        const patchPromises = activeSectors.map(sector => 
          fetch(`http://localhost:8080/api/sectors/${sector.id}/state`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ state: 'INACTIVE' })
          })
        );
        await Promise.all(patchPromises); 
      }

      const payload = sectors.map(sector => ({
        idSector: sector.id,
        enabled: enableAll
      }));

      const response = await fetch('http://localhost:8080/api/sectors/list', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Error al actualizar los sectores');
      setMessage(enableAll ? 'Todos los sectores habilitados' : 'Sectores pausados correctamente');

    } catch (error) {
      console.error("Error al pausar todos:", error);
      loadData(); 
    } finally {
      setTimeout(() => {
        pauseSyncRef.current = false;
        loadData();
      }, 4000);
    }
  };

  // === TRADUCTOR DE FECHAS PARA JAVA ===
  const formatSafeDateTime = (timeObj) => {
    if (!timeObj) return '';
    // Si es un String de Java ("2026-08-06T14:30:00")
    if (typeof timeObj === 'string') return timeObj.replace('T', ' ').substring(0, 16);
    // Si Java lo manda como un Array [2026, 8, 6, 14, 30]
    if (Array.isArray(timeObj)) {
      const [y, mo, d, h, m] = timeObj;
      return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')} ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
    // Si Java lo manda como Objeto {year: 2026, monthValue: 8}
    if (typeof timeObj === 'object') {
      return `${timeObj.year}-${String(timeObj.monthValue).padStart(2, '0')}-${String(timeObj.dayOfMonth).padStart(2, '0')} ${String(timeObj.hour).padStart(2, '0')}:${String(timeObj.minute).padStart(2, '0')}`;
    }
    return String(timeObj);
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

  const handleCreateSector = useCallback(async (event, options = {}) => {
    event.preventDefault();
    const name = newSector.name.trim();
    if (!name) {
      setMessage('Ingresa un nombre para crear el sector');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const shouldCreateDefaultConfiguration = options.defaultConfiguration ?? Boolean(newSector.defaultConfiguration);

    try {
      const created = await createSector({
        name,
        description: newSector.description.trim(),
        currentState: 'INACTIVE',
        defaultConfiguration: false, 
      });

      setSectors((prev) => [created, ...prev]);
      setNewSector({ name: '', description: '', defaultConfiguration: true });

      if (shouldCreateDefaultConfiguration) {
        let safeStartTime = newConfiguration.startTime;
        let safeStartDate = newConfiguration.startDate || new Date().toISOString().split('T')[0];
        
        const payload = [{
          sectorId: created.id,
          startTime: `${safeStartDate} ${safeStartTime}`,
          durationMinutes: Number(newConfiguration.durationMinutes),
          enabled: Boolean(newConfiguration.enabled)
        }];
        await handleSaveConfigurationsBatch(payload);
      }

      setMessage('Sector creado correctamente');
      await loadData();
    } catch (error) {
      setMessage(error.message || 'No se pudo crear el sector');
    }
  }, [loadData, newConfiguration, newSector, handleSaveConfigurationsBatch]);

  const handleToggleConfiguration = useCallback(async (config) => {
    try {
      // BARRERA DE FRONTEND: Evita activar rutinas pasadas
      const configTime = new Date(formatSafeDateTime(config.startTime).replace(' ', 'T')).getTime();
      if (!config.enabled && configTime <= new Date().getTime()) {
        setMessage('No puedes activar una rutina que ya expiró');
        return; // Cortamos la ejecución antes de llamar a Java
      }

      const payload = {
        ...config,
        startTime: formatSafeDateTime(config.startTime),
        enabled: !config.enabled
      };
      
      const updated = await updateConfiguration(config.id, payload);
      setConfigurations((prev) => prev.map((item) => (item.id === config.id ? updated : item)));
    } catch (error) {
      console.error("Error en toggle de rutina:", error);
      setMessage(error.message || 'No se pudo actualizar la rutina');
    }
  }, []);

  const handleUpdateRoutine = useCallback(async (id, payload) => {
    try {
      // Blindaje adicional por si editamos una rutina
      const finalPayload = {
        ...payload,
        startTime: formatSafeDateTime(payload.startTime)
      };
      const updated = await updateConfiguration(id, finalPayload);
      setConfigurations((prev) => prev.map((item) => (item.id === id ? updated : item)));
      await loadData();
    } catch (error) {
      console.error('Error al actualizar la rutina:', error);
    }
  }, [loadData]);

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

  const handleDeleteSector = useCallback(async (id) => {
    try {
      const response = await fetch(`http://localhost:8080/api/sectors/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error al eliminar el sector');
      
      setSectors((prev) => prev.filter((item) => item.id !== id));
      setMessage('Sector archivado correctamente');
    } catch (error) {
      console.error(error);
      setMessage('No se pudo eliminar el sector');
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
      handleUpdateSector,
      handleDeleteSector
    }),
    [configurations, handleCreateSector, handleSaveConfigurationsBatch, handleToggleMain, handleToggleSector, history, isActive, loading, loadData, message, newConfiguration, newSector, sectors, handleToggleAllConfigurations, handleUpdateSector, handleDeleteSector]
  );

  return value;
}