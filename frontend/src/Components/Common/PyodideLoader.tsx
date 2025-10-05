import React, { useEffect, useState } from 'react';
import { useDataStore } from '../../store/dataStore';

interface PyodideLoaderProps {
  visible: boolean;
}

const PyodideLoader: React.FC<PyodideLoaderProps> = ({ visible }) => {
  const { pyodideReady } = useDataStore();
  const [hideLoader, setHideLoader] = useState(false);
  
  // Efecto para ocultar el loader después de que pyodide esté listo
  useEffect(() => {
    if (pyodideReady) {
      // Esperar un poco antes de ocultar por completo para que se vea la transición
      const timer = setTimeout(() => setHideLoader(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [pyodideReady]);

  if (!visible || hideLoader) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center pointer-events-none">
      <div className={`py-4 px-8 rounded-lg border border-cyan-400/50 bg-cyan-900/70 backdrop-blur-md shadow-lg transition-all duration-500 ${pyodideReady ? 'opacity-0 translate-y-[-10px]' : 'opacity-100'}`}>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-8 h-8 rounded-full border-3 border-t-transparent border-cyan-300/70 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-cyan-200"></div>
            </div>
          </div>
          <div>
            <p className="text-cyan-200 font-medium">
              {pyodideReady ? 'Motor Python listo' : 'Inicializando motor Python...'}
            </p>
            <p className="text-cyan-400/60 text-xs mt-1">
              Preparando el entorno para análisis de datos
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PyodideLoader;