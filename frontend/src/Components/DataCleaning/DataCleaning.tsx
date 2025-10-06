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
    <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto text-black">
      
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

      {/* Configuración de Columnas - Diseño Mejorado */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold mb-3">📋 Configuración de Columnas</h3>
        <div className="space-y-4">
          {stats.columns.map(col => {
            const isSelected = cleaningConfig.selectedColumns.includes(col.name);
            const effectiveType = getEffectiveColumnType(col.name);
            const strategy = cleaningConfig.columnStrategies[col.name] || {
              removeNulls: false,
              removeOutliers: false,
              fillStrategy: 'drop' as const,
              selectedCategories: effectiveType === 'categorical' ? [...col.uniqueValues] : undefined,
              groupRareCategories: false,
              rareThreshold: 5
            };

            const nullPercentage = rawRows ? (col.nullCount / rawRows.length * 100).toFixed(1) : '0';
            const uniqueCount = col.uniqueValues.length;
            const uniquePercentage = rawRows ? (uniqueCount / rawRows.length * 100).toFixed(1) : '0';

            return (
              <div key={col.name} className="border rounded-lg p-4 bg-white">
                {/* Header con información de la columna */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleColumnSelection(col.name, e.target.checked)}
                      className="rounded"
                    />
                    <div>
                      <div className="font-medium text-sm">{col.name}</div>
                      <div className="text-xs text-gray-500">
                        {col.dtype} • {uniqueCount} únicos ({uniquePercentage}%)
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <select
                      value={effectiveType}
                      onChange={(e) => handleColumnTypeChange(col.name, e.target.value as 'numeric' | 'categorical')}
                      disabled={!isSelected}
                      className="px-2 py-1 border rounded text-sm disabled:bg-gray-100"
                    >
                      <option value="numeric">Numérica</option>
                      <option value="categorical">Categórica</option>
                    </select>
                  </div>
                </div>

                {/* Estadísticas de la columna */}
                <div className="bg-gray-50 rounded p-2 mb-3 text-xs">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {col.nullCount > 0 && (
                      <div className="text-red-600">
                        <span className="font-medium">🚫 Nulos:</span> {col.nullCount} ({nullPercentage}%)
                      </div>
                    )}
                    {effectiveType === 'numeric' && col.min !== undefined && col.max !== undefined && (
                      <div className="text-blue-600">
                        <span className="font-medium">📊 Rango:</span> {col.min.toFixed(2)} - {col.max.toFixed(2)}
                      </div>
                    )}
                    {effectiveType === 'categorical' && (
                      <div className="text-green-600">
                        <span className="font-medium">🏷️ Categorías:</span> {uniqueCount}
                      </div>
                    )}
                    <div className="text-gray-600">
                      <span className="font-medium">🔢 Tipo:</span> {col.dtype}
                    </div>
                  </div>
                </div>

                {/* Configuración de limpieza */}
                {isSelected && (
                  <div className="space-y-3">
                    
                    {/* Manejo de valores nulos */}
                    {col.nullCount > 0 && (
                      <div className="border rounded p-3 bg-blue-50">
                        <div className="font-medium text-sm mb-2">🚫 Valores Nulos ({col.nullCount} filas)</div>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`null-${col.name}`}
                              checked={strategy.removeNulls}
                              onChange={() => handleStrategyChange(col.name, { removeNulls: true, fillStrategy: 'drop' })}
                              className="rounded"
                            />
                            <span className="text-sm">Eliminar filas con nulos</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`null-${col.name}`}
                              checked={!strategy.removeNulls}
                              onChange={() => handleStrategyChange(col.name, { removeNulls: false })}
                              className="rounded"
                            />
                            <span className="text-sm">Rellenar valores nulos:</span>
                          </label>
                          {!strategy.removeNulls && (
                            <div className="ml-6">
                              <select
                                value={strategy.fillStrategy}
                                onChange={(e) => handleStrategyChange(col.name, { 
                                  fillStrategy: e.target.value as typeof strategy.fillStrategy 
                                })}
                                className="px-2 py-1 border rounded text-sm"
                              >
                                {effectiveType === 'numeric' && (
                                  <>
                                    <option value="mean">Promedio</option>
                                    <option value="median">Mediana</option>
                                  </>
                                )}
                                <option value="mode">Moda (valor más común)</option>
                                <option value="forward">Propagación hacia adelante</option>
                                <option value="backward">Propagación hacia atrás</option>
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Configuración específica para numéricas */}
                    {effectiveType === 'numeric' && (
                      <div className="border rounded p-3 bg-green-50">
                        <div className="font-medium text-sm mb-2">📊 Limpieza Numérica</div>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={strategy.removeOutliers}
                            onChange={(e) => handleStrategyChange(col.name, { removeOutliers: e.target.checked })}
                            className="rounded"
                          />
                          <span className="text-sm">Eliminar outliers (método IQR)</span>
                        </label>
                        {col.min !== undefined && col.max !== undefined && (
                          <div className="text-xs text-gray-600 mt-1">
                            Rango actual: {col.min.toFixed(2)} - {col.max.toFixed(2)}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Configuración específica para categóricas */}
                    {effectiveType === 'categorical' && (
                      <div className="border rounded p-3 bg-purple-50">
                        <div className="font-medium text-sm mb-2">🏷️ Filtros Categóricos</div>
                        
                        {/* Selección de categorías */}
                        <div className="mb-3">
                          <div className="text-sm mb-2">Categorías a incluir:</div>
                          <div className="max-h-32 overflow-y-auto border rounded p-2 bg-white">
                            <div className="space-y-1">
                              {col.uniqueValues.slice(0, 20).map(value => {
                                const isSelected = strategy.selectedCategories?.includes(value) || false;
                                return (
                                  <label key={value} className="flex items-center gap-2 text-xs">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        const current = strategy.selectedCategories || [];
                                        const updated = e.target.checked 
                                          ? [...current, value]
                                          : current.filter(v => v !== value);
                                        handleStrategyChange(col.name, { selectedCategories: updated });
                                      }}
                                      className="rounded"
                                    />
                                    <span className="truncate">{value}</span>
                                  </label>
                                );
                              })}
                              {col.uniqueValues.length > 20 && (
                                <div className="text-xs text-gray-500 italic">
                                  ... y {col.uniqueValues.length - 20} categorías más
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleStrategyChange(col.name, { selectedCategories: [...col.uniqueValues] })}
                              className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 rounded"
                            >
                              Seleccionar todas
                            </button>
                            <button
                              onClick={() => handleStrategyChange(col.name, { selectedCategories: [] })}
                              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                            >
                              Deseleccionar todas
                            </button>
                          </div>
                        </div>

                        {/* Agrupación de categorías raras */}
                        <div>
                          <label className="flex items-center gap-2 mb-2">
                            <input
                              type="checkbox"
                              checked={strategy.groupRareCategories || false}
                              onChange={(e) => handleStrategyChange(col.name, { groupRareCategories: e.target.checked })}
                              className="rounded"
                            />
                            <span className="text-sm">Agrupar categorías poco frecuentes</span>
                          </label>
                          {strategy.groupRareCategories && (
                            <div className="ml-6">
                              <label className="text-xs text-gray-600">
                                Umbral (%):
                                <input
                                  type="number"
                                  min="1"
                                  max="50"
                                  value={strategy.rareThreshold || 5}
                                  onChange={(e) => handleStrategyChange(col.name, { rareThreshold: parseFloat(e.target.value) })}
                                  className="ml-2 w-16 px-1 py-0.5 border rounded text-xs"
                                />
                              </label>
                              <div className="text-xs text-gray-500 mt-1">
                                Categorías con menos de {strategy.rareThreshold || 5}% se agruparán como "Otros"
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Estado actual - Mejorado */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="font-semibold mb-3">📊 Estado Actual del Dataset</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">📁 Datos originales:</span> 
              <span className="text-blue-600">{rawRows?.length || 0} filas</span>
            </div>
            {cleanedRows && (
              <div className="flex justify-between text-sm">
                <span className="font-medium">🧹 Datos limpios:</span> 
                <span className="text-green-600">{cleanedRows.length} filas</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="font-medium">🎯 Columnas seleccionadas:</span> 
              <span className="text-purple-600">{cleaningConfig.selectedColumns.length}</span>
            </div>
            {cleaningConfig.targetColumn && (
              <div className="flex justify-between text-sm">
                <span className="font-medium">🎪 Columna objetivo:</span> 
                <span className="text-orange-600">{cleaningConfig.targetColumn}</span>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            {rawRows && cleanedRows && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">📉 Reducción:</span> 
                  <span className="text-red-600">
                    -{((rawRows.length - cleanedRows.length) / rawRows.length * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">💾 Filas conservadas:</span> 
                  <span className="text-green-600">
                    {((cleanedRows.length / rawRows.length) * 100).toFixed(1)}%
                  </span>
                </div>
              </>
            )}
            
            {/* Conteo de configuraciones activas */}
            <div className="flex justify-between text-sm">
              <span className="font-medium">⚙️ Estrategias activas:</span> 
              <span className="text-indigo-600">
                {Object.keys(cleaningConfig.columnStrategies).length}
              </span>
            </div>
          </div>
        </div>
        
        {/* Indicadores de configuración activa */}
        {cleaningConfig.isEnabled && (
          <div className="mt-3 pt-3 border-t border-blue-200">
            <div className="flex flex-wrap gap-2">
              {cleaningConfig.removeDuplicates && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  🗑️ Sin duplicados
                </span>
              )}
              {Object.entries(cleaningConfig.columnStrategies).map(([col, strategy]) => (
                <div key={col} className="flex gap-1">
                  {strategy.removeNulls && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                      {col}: Sin nulos
                    </span>
                  )}
                  {strategy.removeOutliers && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                      {col}: Sin outliers
                    </span>
                  )}
                  {strategy.selectedCategories && strategy.selectedCategories.length < (stats?.columns.find(c => c.name === col)?.uniqueValues.length || 0) && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                      {col}: Filtrado ({strategy.selectedCategories.length} cats)
                    </span>
                  )}
                  {strategy.groupRareCategories && (
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                      {col}: Agrupado
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
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