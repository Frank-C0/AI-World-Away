import React, { useEffect, useState } from 'react';
import { useDataStore } from '../../store/dataStore';

const DataCleaning: React.FC = () => {
  const { 
    stats, 
    cleaningConfig, 
    setCleaningConfig,
    applyDataCleaning,
    initializeColumnTypes,
    getEffectiveColumnType,
    rawRows,
    cleanedRows
  } = useDataStore();

  const [isProcessing, setIsProcessing] = useState(false);

  // Inicializar tipos de columna cuando se carga el dataset
  useEffect(() => {
    if (stats && Object.keys(cleaningConfig.columnTypes).length === 0) {
      initializeColumnTypes();
      if (cleaningConfig.selectedColumns.length === 0) {
        const allColumns = stats.columns.map(col => col.name);
        setCleaningConfig({ selectedColumns: allColumns });
      }
    }
  }, [stats, cleaningConfig.columnTypes, cleaningConfig.selectedColumns.length, initializeColumnTypes, setCleaningConfig]);

  if (!stats) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600 mb-2">No hay datos cargados</p>
        <p className="text-sm text-gray-500">Carga un dataset desde el panel de datos</p>
      </div>
    );
  }

  const handleConfigChange = (updates: Partial<typeof cleaningConfig>) => {
    setCleaningConfig({ ...updates, isEnabled: true });
  };

  const handleApplyCleaning = async () => {
    console.log('🎯 Apply cleaning button clicked');
    console.log('Current cleaning config:', cleaningConfig);
    console.log('Selected columns:', cleaningConfig.selectedColumns);
    console.log('Column strategies:', cleaningConfig.columnStrategies);
    
    setIsProcessing(true);
    try {
      await applyDataCleaning();
      console.log('✅ Cleaning process completed successfully');
    } catch (error) {
      console.error('❌ Error in handleApplyCleaning:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleColumnSelection = (columnName: string, selected: boolean) => {
    const newSelection = selected 
      ? [...cleaningConfig.selectedColumns, columnName]
      : cleaningConfig.selectedColumns.filter(col => col !== columnName);
    handleConfigChange({ selectedColumns: newSelection });
  };

  const handleColumnTypeChange = (columnName: string, type: 'numeric' | 'categorical') => {
    handleConfigChange({
      columnTypes: { ...cleaningConfig.columnTypes, [columnName]: type }
    });
  };

  const handleStrategyChange = (columnName: string, updates: any) => {
    handleConfigChange({
      columnStrategies: {
        ...cleaningConfig.columnStrategies,
        [columnName]: { ...cleaningConfig.columnStrategies[columnName], ...updates }
      }
    });
  };

  return (
    <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
      
      {/* Configuración Global */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold mb-3">🔧 Configuración General</h3>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={cleaningConfig.removeDuplicates}
              onChange={(e) => handleConfigChange({ removeDuplicates: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Eliminar duplicados</span>
          </label>
          
          <div>
            <label className="block text-sm font-medium mb-1">Columna objetivo:</label>
            <select
              value={cleaningConfig.targetColumn || ''}
              onChange={(e) => handleConfigChange({ targetColumn: e.target.value || null })}
              className="w-full px-2 py-1 border rounded text-sm"
            >
              <option value="">Sin objetivo específico</option>
              {stats.columns.map(col => (
                <option key={col.name} value={col.name}>{col.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Configuración de Columnas - Una sola columna */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold mb-3">📋 Configuración de Columnas</h3>
        <div className="space-y-3">
          {stats.columns.map(col => {
            const isSelected = cleaningConfig.selectedColumns.includes(col.name);
            const effectiveType = getEffectiveColumnType(col.name);
            const strategy = cleaningConfig.columnStrategies[col.name] || {
              removeNulls: false,
              removeOutliers: false,
              fillStrategy: 'drop' as const
            };

            return (
              <div key={col.name} className="border rounded-lg p-3 bg-white">
                <div className="grid grid-cols-12 gap-3 items-center">
                  
                  {/* Checkbox de selección */}
                  <div className="col-span-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleColumnSelection(col.name, e.target.checked)}
                      className="rounded"
                    />
                  </div>
                  
                  {/* Nombre de columna */}
                  <div className="col-span-2">
                    <div className="font-medium text-sm">{col.name}</div>
                    <div className="text-xs text-gray-500">
                      {col.nullCount > 0 && `${col.nullCount} nulos`}
                    </div>
                  </div>
                  
                  {/* Tipo de columna */}
                  <div className="col-span-2">
                    <select
                      value={effectiveType}
                      onChange={(e) => handleColumnTypeChange(col.name, e.target.value as 'numeric' | 'categorical')}
                      disabled={!isSelected}
                      className="w-full px-2 py-1 border rounded text-sm disabled:bg-gray-100"
                    >
                      <option value="numeric">Numérica</option>
                      <option value="categorical">Categórica</option>
                    </select>
                  </div>
                  
                  {/* Estrategias específicas */}
                  <div className="col-span-7">
                    {isSelected && (
                      <div className="flex gap-2 flex-wrap">
                        
                        {/* Eliminar nulos */}
                        {col.nullCount > 0 && (
                          <label className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={strategy.removeNulls}
                              onChange={(e) => handleStrategyChange(col.name, { removeNulls: e.target.checked })}
                              className="rounded"
                            />
                            <span className="text-xs">Sin nulos</span>
                          </label>
                        )}
                        
                        {/* Eliminar outliers (solo numérica) */}
                        {effectiveType === 'numeric' && (
                          <label className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={strategy.removeOutliers}
                              onChange={(e) => handleStrategyChange(col.name, { removeOutliers: e.target.checked })}
                              className="rounded"
                            />
                            <span className="text-xs">Sin outliers</span>
                          </label>
                        )}
                        
                        {/* Estrategia de relleno */}
                        {col.nullCount > 0 && !strategy.removeNulls && (
                          <select
                            value={strategy.fillStrategy}
                            onChange={(e) => handleStrategyChange(col.name, { 
                              fillStrategy: e.target.value as typeof strategy.fillStrategy 
                            })}
                            className="px-2 py-1 border rounded text-xs"
                          >
                            <option value="drop">Eliminar</option>
                            {effectiveType === 'numeric' && (
                              <>
                                <option value="mean">Promedio</option>
                                <option value="median">Mediana</option>
                              </>
                            )}
                            <option value="mode">Moda</option>
                            <option value="forward">Adelante</option>
                            <option value="backward">Atrás</option>
                          </select>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Estado actual */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="font-semibold mb-2">📊 Estado Actual</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Datos originales:</span> {rawRows?.length || 0} filas
          </div>
          {cleanedRows && (
            <div>
              <span className="font-medium">Datos limpios:</span> {cleanedRows.length} filas
            </div>
          )}
          <div>
            <span className="font-medium">Columnas seleccionadas:</span> {cleaningConfig.selectedColumns.length}
          </div>
          {cleaningConfig.targetColumn && (
            <div>
              <span className="font-medium">Objetivo:</span> {cleaningConfig.targetColumn}
            </div>
          )}
        </div>
      </div>

      {/* Botón de Aplicar Limpieza */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">🚀 Aplicar Limpieza</h3>
            <p className="text-sm text-gray-600">
              Aplica todas las configuraciones de limpieza al dataset
            </p>
          </div>
          
          <button
            onClick={handleApplyCleaning}
            disabled={isProcessing || !rawRows || cleaningConfig.selectedColumns.length === 0}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition"
          >
            {isProcessing ? (
              <>
                <span className="animate-spin mr-2">⚙️</span>
                Procesando...
              </>
            ) : (
              'Aplicar Limpieza'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataCleaning;