import TransitAnimation from '../src/components/IntroAnimation/Transition'
import { useState, useEffect } from 'react'
import './App.css'

function App() {
   const [showAnimation, setShowAnimation] = useState(false);
  
  return (
    <>
      <button onClick={() => setShowAnimation(true)}>
        Ver Animación
      </button>
      
      <TransitAnimation 
        isOpen={showAnimation} 
        onClose={() => setShowAnimation(false)} 
      />
    </>
  );
}

export default App
