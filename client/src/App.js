
import React, { useState } from 'react';
import './App.css';
import { useIrrigationApp } from './hooks/useIrrigationApp';
import AppHeader from './components/ui/AppHeader';
import MagicDock from './components/layout/MagicDock';

import OnboardingView from './views/OnboardingView';
import DashboardView from './views/DashboardView';
import ConfigView from './views/ConfigView';
import HistoryView from './views/HistoryView';

function App() {
  // 1. Obtenemos los datos de tu hook (lo guardamos en una variable base)
  const baseAppData = useIrrigationApp();

  // 2. Creamos la memoria para el último sector
  const [lastSectorId, setLastSectorId] = useState(null);

  // 3. Juntamos TODO (lo del hook + la memoria) en tu objeto appData oficial
  const appData = {
    ...baseAppData,
    lastSectorId,
    setLastSectorId
  };

  // 4. Extraemos SOLO lo que App.js necesita (sectors y loading) sin causar conflicto
  const { sectors, loading } = appData;
  
  const [currentView, setCurrentView] = useState('dashboard');

  // === Lógica de Gestos (Swipe) Mejorada ===
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    // 🛠️ FIX GESTOS: Si estás tocando las pestañas deslizables, ignoramos el swipe de página
    const isTouchInScrollableArea = e.target.closest('.tabs-container');
    if (isTouchInScrollableArea) return;

    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const onTouchMove = (e) => {
    if (!touchStart) return; // Si se canceló el inicio, no hacemos nada
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      if (currentView === 'config') setCurrentView('dashboard');
      else if (currentView === 'dashboard') setCurrentView('history');
    }
    if (isRightSwipe) {
      if (currentView === 'history') setCurrentView('dashboard');
      else if (currentView === 'dashboard') setCurrentView('config');
    }
    
    // Reseteamos
    setTouchStart(null);
    setTouchEnd(null);
  };

  // === Renderizado ===
  if (loading) {
    return <div className="app-container"><p>Cargando sistema...</p></div>;
  }

  if (sectors.length === 0) {
    return (
      <div className="app-container">
        <AppHeader 
          title="Bienvenido" 
          subtitle="Iniciemos la configuración" 
          sectors={[]} 
        />
        <OnboardingView appData={appData} />
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'config': return <ConfigView appData={appData} />;
      case 'history': return <HistoryView appData={appData} />;
      case 'dashboard': 
      default: 
        return <DashboardView appData={appData} setCurrentView={setCurrentView} />;
    }
  };

  return (
    <div 
      className="app-container"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <AppHeader 
        title={currentView === 'dashboard' ? 'Sistema de riego' : currentView === 'config' ? 'Zonas y Rutinas' : 'Registro'} 
        subtitle={currentView === 'dashboard' ? 'Panel de control' : 'Desliza para volver'}
        sectors={sectors} 
        onZoneClick={() => setCurrentView('config')}
      />

      {/* Contenedor ÚNICO de la vista actual */}
      <div className="view-enter" key={`view-${currentView}`}>
        {renderView()}
      </div>

      <MagicDock currentView={currentView} setCurrentView={setCurrentView} />
    </div>
  );
}

export default App;