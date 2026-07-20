import React from 'react';

export default function MagicDock({ currentView, setCurrentView }) {
return (
    <div className="magic-dock-wrapper">
        <nav className="magic-dock">
            <button 
                className={`dock-btn ${currentView === 'config' ? 'active' : ''}`}
                onClick={() => setCurrentView('config')}
                aria-label="Configuración"
            >
                ⚙️
            </button>
            
            <button 
                className={`dock-btn ${currentView === 'dashboard' ? 'active' : ''}`}
                onClick={() => setCurrentView('dashboard')}
                aria-label="Inicio"
            >
                💧
            </button>

            <button 
                className={`dock-btn ${currentView === 'history' ? 'active' : ''}`}
                onClick={() => setCurrentView('history')}
                aria-label="Historial"
            >
                🕒
            </button>
        </nav>
    </div>
    );
}