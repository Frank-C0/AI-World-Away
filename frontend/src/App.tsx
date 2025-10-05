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
      <Interfaz />

      {showAnimation&& (
        <Transition 
        isOpen={showAnimation} 
        onClose={() => setShowAnimation(false)} 
        />
      )}

      {/* Botones para cambiar vistas */}
      <div className="controls" style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
        <button onClick={() => setShowTables(!showTables)}>
          {showTables ? 'Cerrar Tablas' : 'Ver Tablas'}
        </button>
        <button onClick={() => setShowGraficos(!showGraficos)}>
          {showGraficos ? 'Cerrar Gráficos' : 'Ver Gráficos'}
        </button>
      </div>

      {/* Overlays */}
      {showTables && (
        <div className="overlay">
          <Tables />
        </div>
      )}
      {showGraficos && (
        <div className="overlay">
          <Graficos />
        </div>
      )}
    </div>
  );
}

export default App;
