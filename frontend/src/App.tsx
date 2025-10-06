import { useState } from 'react';
import './App.css';

import Transition from './Components/IntroAnimation/Transition';
import Interfaz from './Components/ThreeD/Interfaz';
import Tables from './Components/Tables/Tables';
import Graficos from './Components/Charts/Graficos';
import DataStatsModal from './Components/Tables/DataStatsModal';
import CorrelationModal from './Components/Charts/CorrelationModal';
import DataCleaning from './Components/DataCleaning/DataCleaning';
import Modal from './Components/Common/Modal';
import { useUIStore } from './store/uiStore';
import { useDataStore } from './store/dataStore';
import DataLoader from './Components/Common/DataLoader';
import PyodideLoader from './Components/Common/PyodideLoader';

function App() {
  const [showAnimation, setShowAnimation] = useState(true);
  const [loadingPyodide, setLoadingPyodide] = useState(false);
  const { activeModal, toggleModal } = useUIStore();
  const stats = useDataStore(s => s.stats);
  const initPyodideEarly = useDataStore(s => s.initPyodideEarly);
  const pyodideReady = useDataStore(s => s.pyodideReady);
  const applyDataCleaning = useDataStore(s => s.applyDataCleaning);
  const cleaningConfig = useDataStore(s => s.cleaningConfig);

  // Initialize Pyodide in the background as soon as the app loads
  const handleAnimationEnd = () => {
    setShowAnimation(false);
    setLoadingPyodide(true);
    initPyodideEarly().then(() => {
      setLoadingPyodide(false);
    });
  };

  return (
    <div className="App">
      {/* ✅ PERMANENT BACKGROUND: 3D Interface */}
      <Interfaz />

      {/* ✅ FLOATING BUTTONS */}
      {!showAnimation && (
        <div className="controls">
          <button onClick={() => toggleModal('data')} className={activeModal === 'data' ? 'active' : ''}>
            {activeModal === 'data' ? '✕ Data' : '🗂️ Data'}
          </button>
          <button onClick={() => toggleModal('tables')} className={activeModal === 'tables' ? 'active' : ''}>
            {activeModal === 'tables' ? '✕ Tables' : '📊 Tables'}
          </button>

      {/* ✅ PANEL: Data Loader */}
      <Modal id="data" title="🗂️ Data Upload" widthClass="w-[760px]" heightClass="max-h-[80vh]">
        <DataLoader />
      </Modal>

          <button onClick={() => toggleModal('charts')} className={activeModal === 'charts' ? 'active' : ''}>
            {activeModal === 'charts' ? '✕ Charts' : '📈 Charts'}
          </button>
          <button onClick={() => toggleModal('cleaning')} className={activeModal === 'cleaning' ? 'active' : ''} disabled={!stats}>
            {activeModal === 'cleaning' ? '✕ Limpieza' : '🧹 Limpieza'}
          </button>
          <button onClick={() => toggleModal('correlation')} className={activeModal === 'correlation' ? 'active' : ''} disabled={!stats}>
            {activeModal === 'correlation' ? '✕ Correlación' : '🔄 Correlación'}
          </button>
          <button onClick={() => toggleModal('stats')} className={activeModal === 'stats' ? 'active' : ''} disabled={!stats}>
            {activeModal === 'stats' ? '✕ Statistics' : '📑 Statistics'}
          </button>
        </div>
      )}

      {/* ✅ PANEL: Tables */}
      <Modal id="tables" title="📊 Data Tables" widthClass="w-[900px]" heightClass="max-h-[78vh]">
        <Tables />
      </Modal>

      {/* ✅ PANEL: Charts */}
      <Modal id="charts" title="📈 Charts" widthClass="w-[820px]" heightClass="h-[560px]">
        <Graficos />
      </Modal>
      
      {/* ✅ PANEL: Limpieza de Datos */}
      <Modal 
        id="cleaning" 
        title="🧹 Limpieza de Datos" 
        widthClass="w-[1000px]" 
        heightClass="max-h-[85vh]"
        onClose={() => {
          // Solo aplicar si está habilitada la limpieza
          if (cleaningConfig.isEnabled) {
            applyDataCleaning();
          }
        }}
      >
        <DataCleaning />
      </Modal>
      
      <Modal id="correlation" title="🔄 Matriz de Correlación" widthClass="w-[900px]" heightClass="h-[640px]">
        <CorrelationModal embedded />
      </Modal>

      {/* ✅ PANEL: Dataset Statistics */}
      <Modal id="stats" title="📑 Dataset Statistics" widthClass="w-[1000px]" heightClass="max-h-[80vh]">
        <DataStatsModal embedded />
      </Modal>

      {/* ✅ INTRO ANIMATION */}
      {showAnimation && (
        <div className="transition-container">
          <Transition 
            isOpen={showAnimation} 
            onClose={handleAnimationEnd} 
          />
        </div>
      )}

      {/* Loader de Pyodide */}
      <PyodideLoader visible={loadingPyodide || (!pyodideReady && !showAnimation)} />
    </div>
  );
}

export default App;
