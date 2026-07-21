
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
  const appData = useIrrigationApp();
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

      {/* 🛠️ FIX VISUAL: Eliminamos el bloque {appData.message} que aparecía molestando aquí */}

      <div className="view-enter" key={currentView}>
        {renderView()}
      </div>

      <MagicDock currentView={currentView} setCurrentView={setCurrentView} />
    </div>
  );
}

export default App;