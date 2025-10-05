import { useState } from 'react';
import './App.css';

import Transition from './Components/IntroAnimation/Transition';
import Interface from './Components/ThreeD/Interface';
import Tables from './Components/Tables/Tables';
import Graficos from './Components/Charts/Graficos';

function App() {
  const [showAnimation, setShowAnimation] = useState(true); 
  const [showInterface, setShowInterface] = useState(false);
  const [showTables, setShowTables] = useState(false);
  const [showGraficos, setShowGraficos] = useState(false);

  // ✅ Cuando termina la animación de inicio, mostramos la Interfaz
  const handleCloseAnimation = () => {
    setShowAnimation(false);
    setTimeout(() => setShowInterface(true), 600); // pequeño delay para transiciones suaves
  };

  return (
    <div className="App">

      {/* Animación de presentación */}
      {showAnimation && (
        <Transition 
          isOpen={showAnimation} 
          onClose={handleCloseAnimation} 
        />
      )}

      {/* Botones para cambiar vistas (SIEMPRE visibles excepto durante la animación) */}
      {!showAnimation && (
        <div className="controls" style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
          <button onClick={() => setShowTables(!showTables)}>
            {showTables ? 'Cerrar Tablas' : 'Ver Tablas'}
          </button>
          <button onClick={() => setShowGraficos(!showGraficos)}>
            {showGraficos ? 'Cerrar Gráficos' : 'Ver Gráficos'}
          </button>
        </div>
      )}

      {/* Interfaz 3D (solo visible después del cierre de la animación) */}
      {showInterface && (
        <div 
          className="interfaz" 
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            zIndex: 5,
            width: showTables || showGraficos ? '70%' : '100%', 
            height: '100%',
          }}
        >
          <Interface />
        </div>
      )}

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
