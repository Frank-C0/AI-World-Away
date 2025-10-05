import { useState, useEffect } from 'react';
import './App.css';

import Transition from './Components/IntroAnimation/Transition';
import Interfaz from './Components/ThreeD/Interfaz';
import Tables from './Components/Tables/Tables';
import Graficos from './Components/Charts/Graficos';
import DataStatsModal from './Components/Tables/DataStatsModal';
import Modal from './Components/Common/Modal';
import { useUIStore } from './store/uiStore';
import { useDataStore } from './store/dataStore';
import DataLoader from './Components/Common/DataLoader';

function App() {
  const [showAnimation, setShowAnimation] = useState(true);
  const { activeModal, toggleModal } = useUIStore();
  const stats = useDataStore(s => s.stats);
  const initPyodideEarly = useDataStore(s => s.initPyodideEarly);

  useEffect(() => {
    // Inicializa Pyodide en segundo plano apenas carga la app
    initPyodideEarly();
  }, [initPyodideEarly]);

  return (
    <div className="App">
      {/* ✅ FONDO PERMANENTE: Interfaz 3D */}
      <Interfaz />

      {/* ✅ BOTONES FLOTANTES */}
      {!showAnimation && (
        <div className="controls">
          <button onClick={() => toggleModal('data')} className={activeModal === 'data' ? 'active' : ''}>
            {activeModal === 'data' ? '✕ Datos' : '🗂️ Datos'}
          </button>
          <button onClick={() => toggleModal('tables')} className={activeModal === 'tables' ? 'active' : ''}>
            {activeModal === 'tables' ? '✕ Tablas' : '📊 Tablas'}
          </button>
      {/* ✅ PANEL: Data Loader */}
      <Modal id="data" title="🗂️ Carga de Datos" widthClass="w-[760px]" heightClass="max-h-[80vh]">
        <DataLoader />
      </Modal>
          <button onClick={() => toggleModal('charts')} className={activeModal === 'charts' ? 'active' : ''}>
            {activeModal === 'charts' ? '✕ Gráficos' : '📈 Gráficos'}
          </button>
          <button onClick={() => toggleModal('stats')} className={activeModal === 'stats' ? 'active' : ''} disabled={!stats}>
            {activeModal === 'stats' ? '✕ Stats' : '📑 Stats'}
          </button>
        </div>
      )}

      {/* ✅ PANEL: Tablas */}
      <Modal id="tables" title="📊 Tablas de Datos" widthClass="w-[900px]" heightClass="max-h-[78vh]">
        <Tables />
      </Modal>

      {/* ✅ PANEL: Gráficos */}
      <Modal id="charts" title="📈 Gráficos" widthClass="w-[820px]" heightClass="h-[560px]">
        <Graficos />
      </Modal>

      <Modal id="stats" title="📑 Estadísticas del Dataset" widthClass="w-[1000px]" heightClass="max-h-[80vh]">
        <DataStatsModal embedded />
      </Modal>

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