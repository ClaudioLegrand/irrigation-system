
import React, { useState } from 'react';
import './App.css';
import { useIrrigationApp } from './hooks/useIrrigationApp';
import AppHeader from './components/ui/AppHeader';
import MagicDock from './components/layout/MagicDock';

// Importaremos las vistas en el próximo paso
import OnboardingView from './views/OnboardingView';
import DashboardView from './views/DashboardView';
import ConfigView from './views/ConfigView';
import HistoryView from './views/HistoryView';

function App() {
  const appData = useIrrigationApp();
  const { sectors, loading } = appData;
  
  // Estado para saber en qué pantalla estamos ('dashboard', 'config', 'history')
  const [currentView, setCurrentView] = useState('dashboard');

  // === Lógica de Gestos (Swipe) ===
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);
  
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    // Navegación tipo carrusel: Config <- Dashboard -> History
    if (isLeftSwipe) {
      if (currentView === 'config') setCurrentView('dashboard');
      else if (currentView === 'dashboard') setCurrentView('history');
    }
    if (isRightSwipe) {
      if (currentView === 'history') setCurrentView('dashboard');
      else if (currentView === 'dashboard') setCurrentView('config');
    }
  };

  // === Renderizado Condicional Inteligente ===
  if (loading) {
    return <div className="app-container"><p>Cargando sistema...</p></div>;
  }

  // Si no hay sectores, forzamos la vista de Onboarding (Estado Vacío)
  if (sectors.length === 0) {
    return (
      <div className="app-container">
        <AppHeader title="Bienvenido" subtitle="Iniciemos la configuración" status="Espera" />
        <OnboardingView appData={appData} />
      </div>
    );
  }

  // Renderizador dinámico de la vista actual
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
        title={currentView === 'dashboard' ? 'Sistema de riego' : currentView === 'config' ? 'Ajustes' : 'Registro'} 
        subtitle={currentView === 'dashboard' ? 'Panel de control' : 'Desliza para volver'}
        status={appData.isActive ? 'Activo' : 'Inactivo'} 
      />

      {appData.message && (
        <div className="glass-panel" style={{marginBottom: '16px', borderColor: 'var(--primary)'}}>
          <p style={{color: 'var(--primary)'}}>{appData.message}</p>
        </div>
      )}

      {/* Aquí se inyecta la vista actual con una animación CSS */}
      <div className="view-enter" key={currentView}>
        {renderView()}
      </div>

      <MagicDock currentView={currentView} setCurrentView={setCurrentView} />
    </div>
  );
}

export default App;