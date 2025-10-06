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
  
  // Generate correlation plot whenever data or method changes
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
        console.error('Error generating correlation:', err);
        setError(`Error generating correlation: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
            <strong>Pearson:</strong> Measures linear correlation (most common).
            <strong className="ml-2">Spearman:</strong> Rank-based correlation, useful for non-linear relationships.
            <strong className="ml-2">Kendall:</strong> Similar to Spearman but more robust to outliers.
          </p>
        </div>
      </div>
      
      <div className="flex-grow bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
        {loading && (
          <div className="flex flex-col items-center justify-center text-cyan-300">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mb-2"></div>
            <p>Generating correlation matrix...</p>
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
              alt="Correlation Matrix" 
              className="max-w-full max-h-full object-contain" 
            />
          </div>
        )}
        
        {!correlationImage && !loading && !error && data.length < 3 && (
          <div className="text-cyan-300 text-center">
            <p>Could not generate the correlation matrix.</p>
            <p className="text-xs mt-2">At least two numeric columns are required to compute correlations.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CorrelationModal;
