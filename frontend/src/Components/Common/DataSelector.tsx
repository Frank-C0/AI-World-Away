import React from 'react';
import { useDataStore } from '../../store/dataStore';

interface DataSelectorProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const DataSelector: React.FC<DataSelectorProps> = ({ className = '', size = 'md' }) => {
  const { 
    showCleanedData, 
    setShowCleanedData, 
    cleaningConfig, 
    cleanedRows, 
    rawRows 
  } = useDataStore();

  if (!cleaningConfig.isEnabled || !cleanedRows) {
    return null;
  }

  const sizeClasses = {
    sm: 'h-6 w-11 after:h-4 after:w-4 after:top-0.5 after:left-0.5 peer-checked:after:translate-x-5',
    md: 'h-7 w-12 after:h-5 after:w-5 after:top-1 after:left-1 peer-checked:after:translate-x-5',
    lg: 'h-8 w-14 after:h-6 after:w-6 after:top-1 after:left-1 peer-checked:after:translate-x-6'
  };

  const labelSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className={`font-medium text-gray-700 ${labelSizeClasses[size]}`}>
        Datos:
      </span>
      
      <div className="flex items-center gap-2">
        <span className={`${labelSizeClasses[size]} text-gray-600 ${!showCleanedData ? 'font-medium text-gray-800' : ''}`}>
          Crudos
        </span>
        
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={showCleanedData}
            onChange={(e) => setShowCleanedData(e.target.checked)}
            className="sr-only peer"
          />
          <div className={`
            relative bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 
            rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white 
            after:content-[''] after:absolute after:bg-white after:border-gray-300 after:border 
            after:rounded-full after:transition-all peer-checked:bg-gradient-to-r 
            peer-checked:from-green-400 peer-checked:to-green-600 
            ${sizeClasses[size]}
          `}>
          </div>
        </label>
        
        <span className={`${labelSizeClasses[size]} text-gray-600 ${showCleanedData ? 'font-medium text-green-700' : ''}`}>
          Limpios
        </span>
      </div>
      
      <div className={`${labelSizeClasses[size]} text-gray-500 bg-gray-50 px-2 py-1 rounded`}>
        {showCleanedData 
          ? `${cleanedRows?.length || 0} filas` 
          : `${rawRows?.length || 0} filas`
        }
      </div>
    </div>
  );
};

export default DataSelector;