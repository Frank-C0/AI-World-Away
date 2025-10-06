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
    // Initialize Pyodide in the background as soon as the app loads
    initPyodideEarly();
  }, [initPyodideEarly]);

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

      {/* ✅ PANEL: Dataset Statistics */}
      <Modal id="stats" title="📑 Dataset Statistics" widthClass="w-[1000px]" heightClass="max-h-[80vh]">
        <DataStatsModal embedded />
      </Modal>

      {/* ✅ INTRO ANIMATION */}
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
