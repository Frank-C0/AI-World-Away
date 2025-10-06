import React, { useState, useEffect } from 'react';
import { useDataStore } from '../../store/dataStore';
import { pyodideContext } from '../../pyodideClient';
import './styles/correlation.css';

interface CorrelationModalProps {
  embedded?: boolean;
}

const CorrelationModal: React.FC<CorrelationModalProps> = ({ embedded = false }) => {
  const [correlationImage, setCorrelationImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<'pearson' | 'kendall' | 'spearman'>('pearson');
  const [targetCorrelations, setTargetCorrelations] = useState<any[]>([]);
  const [loadingRanking, setLoadingRanking] = useState(false);
  const [useCleanedDataForCorr, setUseCleanedDataForCorr] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const { 
    data, 
    rawRows, 
    cleanedRows, 
    cleaningConfig, 
    pyodideReady 
  } = useDataStore();
  
  // Determinar qué datos usar para el análisis
  const effectiveData = useCleanedDataForCorr && cleanedRows ? cleanedRows : rawRows || data;
  
  // Genera el gráfico de correlación cuando cambian los datos o el método (NO cuando cambia el zoom)
  useEffect(() => {
    const generateCorrelation = async () => {
      if (!effectiveData || effectiveData.length === 0 || !pyodideReady) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Generar imagen con tamaño óptimo basado en número de columnas
        const numCols = effectiveData.length > 0 ? Object.keys(effectiveData[0]).length : 0;
        // Ajustar tamaño automáticamente según número de variables
        const optimalSize = Math.max(1.0, Math.min(2.0, numCols * 0.12)); 
        
        const imageData = await pyodideContext.generateCorrelationPlot(effectiveData, method, optimalSize);
        
        if (imageData.startsWith('error:')) {
          setError(imageData.substring(7));
          setCorrelationImage(null);
        } else {
          setCorrelationImage(imageData);
        }
      } catch (err) {
        console.error('Error generating correlation:', err);
        setError(`Error generating correlation: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setCorrelationImage(null);
      } finally {
        setLoading(false);
      }
    };
    
    generateCorrelation();
  }, [effectiveData, method, pyodideReady]);

  // Calcular ranking de correlaciones con variable objetivo
  useEffect(() => {
    const calculateRanking = async () => {
      if (!effectiveData || effectiveData.length === 0 || !pyodideReady || !cleaningConfig.targetColumn) {
        setTargetCorrelations([]);
        return;
      }
      
      setLoadingRanking(true);
      
      try {
        const correlations = await pyodideContext.calculateTargetCorrelations(
          effectiveData, 
          cleaningConfig.targetColumn, 
          method
        );
        setTargetCorrelations(correlations);
      } catch (err) {
        console.error('Error calculando ranking de correlaciones:', err);
        setTargetCorrelations([]);
      } finally {
        setLoadingRanking(false);
      }
    };
    
    calculateRanking();
  }, [effectiveData, cleaningConfig.targetColumn, method, pyodideReady]);
  
  return (
    <div className="flex flex-col h-full">
      {/* Controles principales */}
      <div className="mb-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Selector de método de correlación */}
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

          {/* Control de pantalla completa */}
          <div>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm flex items-center gap-2 transition-colors"
            >
              {isFullscreen ? '📋 Vista normal' : '🔍 Pantalla completa'}
            </button>
          </div>
        </div>

        {/* Selector de datos y explicación */}
        <div className="flex items-center justify-between">
          {/* Selector de datos personalizado para correlaciones */}
          {cleaningConfig.isEnabled && cleanedRows && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Usar para análisis:</span>
              <div className="flex items-center gap-2">
                <span className={`text-sm text-gray-600 ${!useCleanedDataForCorr ? 'font-medium text-gray-800' : ''}`}>
                  Datos crudos
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useCleanedDataForCorr}
                    onChange={(e) => setUseCleanedDataForCorr(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="relative h-6 w-11 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:h-4 after:w-4 after:rounded-full after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-green-400 peer-checked:to-green-600"></div>
                </label>
                <span className={`text-sm text-gray-600 ${useCleanedDataForCorr ? 'font-medium text-green-700' : ''}`}>
                  Datos limpios
                </span>
              </div>
              <div className="text-sm text-gray-500 bg-gray-50 px-2 py-1 rounded">
                {effectiveData?.length || 0} filas
              </div>
            </div>
          )}

          <div className="text-xs text-blue-200">
            <p>
              <strong>Pearson:</strong> Correlación lineal (más común).
              <strong className="ml-2">Spearman:</strong> Por rangos, útil para relaciones no lineales.
              <strong className="ml-2">Kendall:</strong> Similar a Spearman pero más robusto a outliers.
            </p>
          </div>
        </div>
      </div>
      
      <div className={`flex-grow flex gap-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-gray-900 p-4' : embedded ? 'max-h-[calc(100%-5rem)]' : 'max-h-[calc(80vh-10rem)]'} ${!isFullscreen ? 'overflow-hidden' : ''}`}>
        {/* Gráfico de correlación */}
        <div className={`${isFullscreen ? 'flex-grow' : 'flex-grow'} bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center relative`}>
          {/* Botón cerrar en modo pantalla completa */}
          {isFullscreen && (
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 z-10 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
            >
              ✕ Cerrar
            </button>
          )}
          
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
            <div className="w-full h-full overflow-auto flex items-center justify-center p-2">
              <img 
                src={correlationImage} 
                alt="Matriz de Correlación" 
                className="object-contain cursor-pointer hover:opacity-90 transition-all duration-200"
                style={{ 
                  maxHeight: isFullscreen ? '90vh' : embedded ? '50vh' : '60vh',
                  maxWidth: '100%'
                }}
                onClick={() => setIsFullscreen(!isFullscreen)}
              />
            </div>
          )}
          
          {!correlationImage && !loading && !error && effectiveData.length < 3 && (
            <div className="text-cyan-300 text-center">
              <p>No se pudo generar la matriz de correlación.</p>
              <p className="text-xs mt-2">Se necesitan al menos dos columnas numéricas para calcular correlaciones.</p>
            </div>
          )}
          
          {/* Instrucciones de interacción */}
          {correlationImage && !loading && !error && (
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white text-xs p-2 rounded">
              <p>💡 <strong>Click:</strong> Ver en pantalla completa</p>
            </div>
          )}
        </div>

        {/* Panel de ranking de correlaciones con variable objetivo */}
        {cleaningConfig.targetColumn && !isFullscreen && (
          <div className="w-80 bg-gray-700 rounded-lg p-4 overflow-hidden flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              🎯 Ranking con {cleaningConfig.targetColumn}
            </h3>
            
            {loadingRanking && (
              <div className="flex items-center justify-center py-8 text-cyan-300">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                <span className="ml-2">Calculando...</span>
              </div>
            )}
            
            {!loadingRanking && targetCorrelations.length > 0 && (
              <div className="flex-grow overflow-y-auto custom-scrollbar">
                <div className="space-y-1.5">
                  {targetCorrelations.slice(0, 15).map((corr, index) => (
                    <div 
                      key={corr.column}
                      className="flex items-center justify-between p-1.5 bg-gray-600 rounded text-sm hover:bg-gray-500 transition-colors"
                    >
                      <div className="flex items-center gap-1.5 max-w-[65%]">
                        <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded font-bold min-w-[1.5rem] text-center">
                          {index + 1}
                        </span>
                        <span className="text-white font-medium truncate" title={corr.column}>
                          {corr.column}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div 
                          className={`h-2 rounded ${
                            Math.abs(corr.correlation) > 0.7 ? 'bg-red-400' :
                            Math.abs(corr.correlation) > 0.4 ? 'bg-yellow-400' : 'bg-green-400'
                          }`}
                          style={{ width: `${Math.abs(corr.correlation) * 30}px` }}
                        ></div>
                        <span 
                          className={`font-mono text-xs ${
                            corr.correlation > 0 ? 'text-green-300' : 'text-red-300'
                          }`}
                        >
                          {corr.correlation > 0 ? '+' : ''}{corr.correlation.toFixed(3)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                {targetCorrelations.length > 15 && (
                  <div className="mt-2 text-xs text-gray-400 text-center">
                    Y {targetCorrelations.length - 15} más...
                  </div>
                )}
              </div>
            )}
            
            {!loadingRanking && targetCorrelations.length === 0 && (
              <div className="text-gray-400 text-center py-8">
                <p>No se encontraron correlaciones válidas</p>
                <p className="text-xs mt-2">Verifica que la variable objetivo sea numérica</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CorrelationModal;
