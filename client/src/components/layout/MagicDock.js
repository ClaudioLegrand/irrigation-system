import React from 'react';

export default function MagicDock({ currentView, setCurrentView }) {
  // Calculamos matemáticamente en qué "casillero" debe estar la burbuja (0, 1 o 2)
  let slidePosition = 1; // Centro (dashboard) por defecto
  if (currentView === 'config') slidePosition = 0; // Izquierda
  if (currentView === 'history') slidePosition = 2; // Derecha

  return (
    <div className="magic-dock-wrapper">
        <nav className="magic-dock">
            {/* Contenedor relativo que encierra los botones y la burbuja */}
            <div className="dock-nav-container">
                
                {/* LA MAGIA: La burbuja que se desliza físicamente */}
                <div 
                    className="sliding-bubble" 
                    style={{ transform: `translateX(${slidePosition * 100}%)` }} 
                />

                {/* Botón Configuración (Sectores) */}
                <button 
                    className={`dock-btn ${currentView === 'config' ? 'active' : ''}`}
                    onClick={() => setCurrentView('config')}
                    aria-label="Configuración"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                </button>
                
                {/* Botón Inicio / Dashboard */}
                <button 
                    className={`dock-btn ${currentView === 'dashboard' ? 'active' : ''}`}
                    onClick={() => setCurrentView('dashboard')}
                    aria-label="Inicio"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                </button>

                {/* Botón Historial */}
                <button 
                    className={`dock-btn ${currentView === 'history' ? 'active' : ''}`}
                    onClick={() => setCurrentView('history')}
                    aria-label="Historial"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                </button>
            </div>
        </nav>
    </div>
  );
}