import React, { useState, useEffect } from 'react';
import { useDataStore } from '../../store/dataStore';
import { pyodideContext } from '../../pyodideClient';

interface CorrelationModalProps {
  embedded?: boolean;
}

const CorrelationModal: React.FC<CorrelationModalProps> = ({ embedded = false }) => {
  const [correlationImage, setCorrelationImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<'pearson' | 'kendall' | 'spearman'>('pearson');
  
  const data = useDataStore(state => state.data);
  const pyodideReady = useDataStore(state => state.pyodideReady);
  
  // Genera el gráfico de correlación cuando cambian los datos o el método
  useEffect(() => {
    const generateCorrelation = async () => {
      if (!data || data.length === 0 || !pyodideReady) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const imageData = await pyodideContext.generateCorrelationPlot(data, method);
        
        if (imageData.startsWith('error:')) {
          setError(imageData.substring(7));
          setCorrelationImage(null);
        } else {
          setCorrelationImage(imageData);
        }
      } catch (err) {
        console.error('Error generando correlación:', err);
        setError(`Error generando correlación: ${err instanceof Error ? err.message : 'Error desconocido'}`);
        setCorrelationImage(null);
      } finally {
        setLoading(false);
      }
    };
    
    generateCorrelation();
  }, [data, method, pyodideReady]);
  
  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-blue-600"
                name="correlation-method"
                checked={method === 'pearson'}
                onChange={() => setMethod('pearson')}
              />
              <span className="ml-2 text-sm">Pearson</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-blue-600"
                name="correlation-method"
                checked={method === 'spearman'}
                onChange={() => setMethod('spearman')}
              />
              <span className="ml-2 text-sm">Spearman</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-blue-600"
                name="correlation-method"
                checked={method === 'kendall'}
                onChange={() => setMethod('kendall')}
              />
              <span className="ml-2 text-sm">Kendall</span>
            </label>
          </div>
        </div>
        <div className="mt-2 text-xs">
          <p className="text-blue-200">
            <strong>Pearson:</strong> Mide correlación lineal (más común).
            <strong className="ml-2">Spearman:</strong> Correlación por rangos, útil para relaciones no lineales.
            <strong className="ml-2">Kendall:</strong> Similar a Spearman pero más robusto a outliers.
          </p>
        </div>
      </div>
      
      <div className="flex-grow bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
        {loading && (
          <div className="flex flex-col items-center justify-center text-cyan-300">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mb-2"></div>
            <p>Generando matriz de correlación...</p>
          </div>
        )}
        
        {error && !loading && (
          <div className="text-center text-red-400 p-4">
            <p className="text-lg">⚠️ Error</p>
            <p>{error}</p>
          </div>
        )}
        
        {correlationImage && !loading && !error && (
          <div className="w-full h-full flex items-center justify-center p-2">
            <img 
              src={correlationImage} 
              alt="Matriz de Correlación" 
              className="max-w-full max-h-full object-contain" 
            />
          </div>
        )}
        
        {!correlationImage && !loading && !error && data.length > 0 && (
          <div className="text-cyan-300 text-center">
            <p>No se pudo generar la matriz de correlación.</p>
            <p className="text-xs mt-2">Se necesitan al menos dos columnas numéricas para calcular correlaciones.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CorrelationModal;