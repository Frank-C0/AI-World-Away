import { useState } from 'react';
import './App.css';

import Transition from './Components/IntroAnimation/Transition';
import Interfaz from './Components/ThreeD/Interfaz';
import Tables from './Components/Tables/Tables';
import Graficos from './Components/Charts/Graficos';

function App() {
  const [showAnimation, setShowAnimation] = useState(true);
  const [showTables, setShowTables] = useState(false);
  const [showGraficos, setShowGraficos] = useState(false);

  return (
    <div className="App">
      {/* ✅ FONDO PERMANENTE: Interfaz 3D */}
      <Interfaz />

      {/* ✅ BOTONES FLOTANTES */}
      {!showAnimation && (
        <div className="controls">
          <button 
            onClick={() => setShowTables(!showTables)}
            className={showTables ? 'active' : ''}
          >
            {showTables ? '✕ Cerrar Tablas' : '📊 Ver Tablas'}
          </button>
          <button 
            onClick={() => setShowGraficos(!showGraficos)}
            className={showGraficos ? 'active' : ''}
          >
            {showGraficos ? '✕ Cerrar Gráficos' : '📈 Ver Gráficos'}
          </button>
        </div>
      )}

      {/* ✅ PANEL: Tablas */}
      {showTables && (
        <div className="overlay overlay-tables">
          <div className="overlay-header">
            <h3>📊 Tablas de Datos</h3>
            <button onClick={() => setShowTables(false)} className="close-btn">✕</button>
          </div>
          <div className="overlay-content">
            <Tables />
          </div>
        </div>
      )}

      {/* ✅ PANEL: Gráficos */}
      {showGraficos && (
        <div className="overlay overlay-graficos">
          <div className="overlay-header">
            <h3>📈 Gráficos</h3>
            <button onClick={() => setShowGraficos(false)} className="close-btn">✕</button>
          </div>
          <div className="overlay-content">
            <Graficos />
          </div>
        </div>
      )}

      {/* ✅ ANIMACIÓN DE INTRO */}
      {showAnimation && (
        <div className="transition-container">
          <Transition 
            isOpen={showAnimation} 
            onClose={() => setShowAnimation(false)} 
          />
        </div>
      )}
    </div>
  );
}

export default App;