import React, { useState, useMemo } from 'react';
import { useDataStore } from '../../store/dataStore';

const MLTraining: React.FC = () => {
    const { 
        data, 
        stats, 
        mlConfig, 
        mlResults, 
        mlTraining, 
        setMLConfig, 
        trainXGBoostModel,
        error
    } = useDataStore();

    const [showAdvanced, setShowAdvanced] = useState(false);

    // Opciones disponibles para columnas (heredadas de limpieza)
    const availableColumns = useMemo(() => {
        if (!stats) return [];
        return stats.columns.map(col => col.name);
    }, [stats]);

    // Verificar si la configuración es válida
    const isConfigValid = useMemo(() => {
        return !!mlConfig.targetColumn && 
                     mlConfig.featureColumns.length > 0 && 
                     data.length > 0;
    }, [mlConfig, data]);

    const handleSelectAllFeatures = () => {
        const allFeatures = availableColumns.filter(col => col !== mlConfig.targetColumn);
        setMLConfig({ featureColumns: allFeatures });
    };

    const handleTraining = () => {
        if (!isConfigValid) return;
        trainXGBoostModel();
    };

    if (!stats || !data.length) {
        return (
            <div className="p-6 text-center">
                <div className="text-gray-500 mb-4">
                    <div className="text-4xl mb-2">🤖</div>
                    <h3 className="text-lg font-semibold">No hay datos disponibles</h3>
                    <p className="text-sm mb-4">
                        Para entrenar un modelo de machine learning necesitas:
                    </p>
                    <div className="text-left max-w-md mx-auto space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-blue-500">1️⃣</span>
                            <span>Cargar un dataset desde el panel de datos</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-green-500">2️⃣</span>
                            <span>Configurar la limpieza en la sección "Limpieza de Datos"</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-purple-500">3️⃣</span>
                            <span>Seleccionar columnas objetivo y predictoras</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-h-[85vh] overflow-y-auto">
            <div className="space-y-6 p-6">
                
                {/* Header */}
                <div className="border-b border-gray-200 pb-4">
                    <h2 className="text-xl font-bold text-gray-800 mb-2">🤖 Entrenamiento de Modelo XGBoost</h2>
                    <p className="text-sm text-gray-600">
                        Configura los parámetros finales y entrena tu modelo. 
                        La limpieza de datos y selección de variables se configuran en la sección de "Limpieza de Datos".
                    </p>
                    <div className="text-xs text-blue-600 mt-1">
                        Dataset: {data.length} filas × {availableColumns.length} columnas
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">❌</span>
                            <div>
                                <p className="text-red-800 font-medium">Training Error</p>
                                <p className="text-red-700 text-sm mt-1">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Configuración de Datos - Resumen */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">📋 Configuración de Datos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Target Column Heredada */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                🎯 Variable Objetivo
                            </label>
                            <div className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm">
                                {mlConfig.targetColumn || 'No seleccionada'}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Configurada en la sección de limpieza de datos
                            </p>
                        </div>

                        {/* Feature Columns Summary */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                � Variables Predictoras
                            </label>
                            <div className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm">
                                {mlConfig.featureColumns.length} columnas seleccionadas
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Basadas en las columnas limpias disponibles
                            </p>
                        </div>

                        {/* Quick Actions */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                ⚙️ Configuración Rápida
                            </label>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={handleSelectAllFeatures}
                                    className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded"
                                >
                                    Usar todas las variables
                                </button>
                                <button
                                    onClick={() => {
                                        // Aquí podrías usar un router o store para cambiar la vista
                                        alert('Redirigiendo a la sección de Limpieza de Datos...')
                                    }}
                                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
                                >
                                    Ir a Limpieza de Datos
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Advertencia si no hay configuración válida */}
                    {!isConfigValid && (
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                            <div className="flex items-center gap-2">
                                <span className="text-yellow-600">⚠️</span>
                                <p className="text-sm text-yellow-800">
                                    Para entrenar el modelo, primero ve a la sección de <strong>Limpieza de Datos</strong> 
                                    y configura la variable objetivo y las columnas a usar.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Data Split Configuration */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">📊 División de Datos</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Test Size (%)</label>
                            <input
                                type="number"
                                min="5"
                                max="50"
                                step="5"
                                value={Math.round(mlConfig.testSize * 100)}
                                onChange={(e) => setMLConfig({ testSize: Number(e.target.value) / 100 })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Validation Size (%)</label>
                            <input
                                type="number"
                                min="5"
                                max="50"
                                step="5"
                                value={Math.round(mlConfig.valSize * 100)}
                                onChange={(e) => setMLConfig({ valSize: Number(e.target.value) / 100 })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                disabled={mlConfig.useValAsTest}
                            />
                        </div>
                        <div className="flex items-center">
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={mlConfig.useValAsTest}
                                    onChange={(e) => setMLConfig({ useValAsTest: e.target.checked })}
                                    className="rounded"
                                />
                                Solo entrenamiento/test
                            </label>
                        </div>
                    </div>
                </div>

                {/* Data Preprocessing Simplificado */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">🔄 Preprocesamiento ML</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Categorical Encoding */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                🏷️ Codificación Categórica
                            </label>
                            <select
                                value={mlConfig.categoricalEncoding}
                                onChange={(e) => setMLConfig({ categoricalEncoding: e.target.value as any })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            >
                                <option value="auto">Automático (XGBoost)</option>
                                <option value="onehot">One-Hot Encoding</option>
                                <option value="label">Label Encoding</option>
                                <option value="target">Target Encoding</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                La limpieza de categorías ya fue configurada anteriormente
                            </p>
                        </div>

                        {/* Class Balancing */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <input
                                    type="checkbox"
                                    checked={mlConfig.applyBalancing}
                                    onChange={(e) => setMLConfig({ applyBalancing: e.target.checked })}
                                    className="rounded"
                                />
                                ⚖️ Balanceo de Clases
                            </label>
                            {mlConfig.applyBalancing && (
                                <select
                                    value={mlConfig.balancingMethod}
                                    onChange={(e) => setMLConfig({ balancingMethod: e.target.value as any })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                >
                                    <option value="smote">SMOTE (Sobremuestreo)</option>
                                    <option value="oversampling">Sobremuestreo Aleatorio</option>
                                    <option value="undersampling">Submuestreo Aleatorio</option>
                                </select>
                            )}
                        </div>
                    </div>
                </div>

                {/* XGBoost Parameters - Simplificado */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-800">🌳 Parámetros del Modelo XGBoost</h3>
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
                        >
                            {showAdvanced ? 'Ocultar Avanzados' : 'Mostrar Avanzados'}
                        </button>
                    </div>

                    {/* Basic Parameters */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">🌲 Número de Árboles</label>
                            <input
                                type="number"
                                min="10"
                                max="1000"
                                step="10"
                                value={mlConfig.nEstimators}
                                onChange={(e) => setMLConfig({ nEstimators: Number(e.target.value) })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">📈 Tasa de Aprendizaje</label>
                            <input
                                type="number"
                                min="0.01"
                                max="1"
                                step="0.01"
                                value={mlConfig.learningRate}
                                onChange={(e) => setMLConfig({ learningRate: Number(e.target.value) })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">🔍 Profundidad Máxima</label>
                            <input
                                type="number"
                                min="3"
                                max="15"
                                value={mlConfig.maxDepth}
                                onChange={(e) => setMLConfig({ maxDepth: Number(e.target.value) })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">⏹️ Parada Temprana</label>
                            <input
                                type="number"
                                min="0"
                                max="50"
                                value={mlConfig.earlyStoppingRounds}
                                onChange={(e) => setMLConfig({ earlyStoppingRounds: Number(e.target.value) })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            />
                        </div>
                    </div>

                    {/* Advanced Parameters */}
                    {showAdvanced && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">🎲 Submuestreo</label>
                                <input
                                    type="number"
                                    min="0.1"
                                    max="1"
                                    step="0.1"
                                    value={mlConfig.subsample}
                                    onChange={(e) => setMLConfig({ subsample: Number(e.target.value) })}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">🌿 Submuestreo Features</label>
                                <input
                                    type="number"
                                    min="0.1"
                                    max="1"
                                    step="0.1"
                                    value={mlConfig.colsampleBytree}
                                    onChange={(e) => setMLConfig({ colsampleBytree: Number(e.target.value) })}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">🔧 Regularización L1</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    step="0.1"
                                    value={mlConfig.regAlpha}
                                    onChange={(e) => setMLConfig({ regAlpha: Number(e.target.value) })}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">🔩 Regularización L2</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    step="0.1"
                                    value={mlConfig.regLambda}
                                    onChange={(e) => setMLConfig({ regLambda: Number(e.target.value) })}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">⚖️ Peso Positivo</label>
                                <input
                                    type="number"
                                    min="0.1"
                                    max="10"
                                    step="0.1"
                                    value={mlConfig.scalePositiveWeight}
                                    onChange={(e) => setMLConfig({ scalePositiveWeight: Number(e.target.value) })}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">🎲 Semilla Aleatoria</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={mlConfig.randomState}
                                    onChange={(e) => setMLConfig({ randomState: Number(e.target.value) })}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Training Button - Simplificado */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="font-semibold text-gray-800">🚀 Entrenar Modelo</h3>
                            <div className="text-sm text-gray-600">
                                {isConfigValid ? (
                                    <span className="text-green-600">✅ Configuración válida - Listo para entrenar</span>
                                ) : (
                                    <span className="text-red-600">❌ Configura primero las variables en la sección de limpieza</span>
                                )}
                            </div>
                            {isConfigValid && (
                                <div className="text-xs text-gray-500">
                                    {mlConfig.featureColumns.length} variables predictoras • 
                                    Variable objetivo: {mlConfig.targetColumn}
                                </div>
                            )}
                        </div>
                        
                        <button
                            onClick={handleTraining}
                            disabled={!isConfigValid || mlTraining}
                            className={`px-8 py-3 rounded-lg font-medium flex items-center gap-2 ${
                                isConfigValid && !mlTraining
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            {mlTraining ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                    Entrenando...
                                </>
                            ) : (
                                <>
                                    🤖 Entrenar Modelo
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Results */}
                {mlResults && (
                    <div className="mt-8 space-y-6">
                        <div className="border-t border-gray-200 pt-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Training Results</h3>
                            
                            {mlResults.modelType === 'classification' ? (
                                <div className="space-y-6">
                                    {/* Classification Metrics */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-blue-50 p-4 rounded-lg text-center">
                                            <div className="text-2xl font-bold text-blue-600">
                                                {(((mlResults.accuracy ?? 0) * 100)).toFixed(1)}%
                                            </div>
                                            <div className="text-sm text-gray-600">Accuracy</div>
                                        </div>
                                        
                                        <div className="bg-green-50 p-4 rounded-lg text-center">
                                            <div className="text-2xl font-bold text-green-600">
                                                {(((mlResults.precision ?? 0) * 100)).toFixed(1)}%
                                            </div>
                                            <div className="text-sm text-gray-600">Precision</div>
                                        </div>
                                        
                                        <div className="bg-purple-50 p-4 rounded-lg text-center">
                                            <div className="text-2xl font-bold text-purple-600">
                                                {(((mlResults.recall ?? 0) * 100)).toFixed(1)}%
                                            </div>
                                            <div className="text-sm text-gray-600">Recall</div>
                                        </div>
                                        
                                        <div className="bg-orange-50 p-4 rounded-lg text-center">
                                            <div className="text-2xl font-bold text-orange-600">
                                                {(((mlResults.f1Score ?? 0) * 100)).toFixed(1)}%
                                            </div>
                                            <div className="text-sm text-gray-600">F1-Score</div>
                                        </div>
                                    </div>

                                    {/* Training vs Test Accuracy */}
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="font-semibold text-gray-800 mb-2">Training Performance</h4>
                                        <div className="grid grid-cols-3 gap-4 text-sm">
                                            {typeof mlResults.trainAccuracy === 'number' ? (
                                                <div>
                                                    <span className="text-gray-600">Train Accuracy:</span>
                                                    <span className="ml-2 font-semibold">{((mlResults.trainAccuracy ?? 0) * 100).toFixed(1)}%</span>
                                                </div>
                                            ) : (
                                                <div>
                                                    <span className="text-gray-600">Train Accuracy:</span>
                                                    <span className="ml-2 font-semibold">—</span>
                                                </div>
                                            )}
                                            {typeof mlResults.valAccuracy === 'number' ? (
                                                <div>
                                                    <span className="text-gray-600">Val Accuracy:</span>
                                                    <span className="ml-2 font-semibold">{((mlResults.valAccuracy ?? 0) * 100).toFixed(1)}%</span>
                                                </div>
                                            ) : null}
                                            <div>
                                                <span className="text-gray-600">Test Accuracy:</span>
                                                <span className="ml-2 font-semibold">{(((mlResults.accuracy ?? 0) * 100)).toFixed(1)}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Confusion Matrix */}
                                    {(mlResults.confusionMatrix && mlResults.classNames && mlResults.confusionMatrix.length > 0 && mlResults.classNames.length > 0) ? (
                                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                                            <h4 className="font-semibold text-gray-800 mb-3">🎯 Confusion Matrix</h4>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full">
                                                    <thead>
                                                        <tr>
                                                            <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">Predicted →</th>
                                                            {(mlResults.classNames ?? []).map(className => (
                                                                <th key={className} className="px-2 py-1 text-center text-xs font-medium text-gray-500">
                                                                    {className}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {(mlResults.confusionMatrix ?? []).map((row, i) => (
                                                            <tr key={i}>
                                                                <td className="px-2 py-1 text-xs font-medium text-gray-600">
                                                                    {i === 0 && <span className="writing-mode-vertical-rl text-orientation-mixed">Actual ↓</span>}
                                                                    <div>{(mlResults.classNames ?? [])[i] ?? `Class ${i}`}</div>
                                                                </td>
                                                                {row.map((value, j) => (
                                                                    <td
                                                                        key={j}
                                                                        className={`px-2 py-1 text-center text-sm font-semibold ${
                                                                            i === j 
                                                                                ? 'bg-green-100 text-green-800' 
                                                                                : 'bg-red-50 text-red-600'
                                                                        }`}
                                                                    >
                                                                        {value}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            ) : (
                                /* Regression Metrics */
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-blue-50 p-4 rounded-lg text-center">
                                            <div className="text-2xl font-bold text-blue-600">
                                                {(mlResults.r2Score ?? 0).toFixed(3)}
                                            </div>
                                            <div className="text-sm text-gray-600">R² Score</div>
                                        </div>
                                        
                                        <div className="bg-green-50 p-4 rounded-lg text-center">
                                            <div className="text-2xl font-bold text-green-600">
                                                {(mlResults.rmse ?? 0).toFixed(2)}
                                            </div>
                                            <div className="text-sm text-gray-600">RMSE</div>
                                        </div>
                                        
                                        <div className="bg-purple-50 p-4 rounded-lg text-center">
                                            <div className="text-2xl font-bold text-purple-600">
                                                {(mlResults.mae ?? 0).toFixed(2)}
                                            </div>
                                            <div className="text-sm text-gray-600">MAE</div>
                                        </div>
                                        
                                        <div className="bg-orange-50 p-4 rounded-lg text-center">
                                            <div className="text-2xl font-bold text-orange-600">
                                                {(mlResults.mse ?? 0).toFixed(2)}
                                            </div>
                                            <div className="text-sm text-gray-600">MSE</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Feature Importance */}
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <h4 className="font-semibold text-gray-800 mb-3">🎯 Feature Importance (Top 10)</h4>
                                <div className="space-y-2">
                                    {(mlResults.featureImportance ?? []).slice(0, 10).map((feature, index) => (
                                        <div key={feature.feature + index} className="flex items-center gap-3">
                                            <div className="w-8 text-right text-xs text-gray-500">#{index + 1}</div>
                                            <div className="flex-1 text-sm font-medium text-gray-700">{feature.feature}</div>
                                            <div className="w-32">
                                                <div className="bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-600 rounded-full h-2"
                                                        style={{ width: `${Math.min(100, (feature.importance ?? 0) * 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                            <div className="w-16 text-right text-xs text-gray-600">
                                                {((feature.importance ?? 0) * 100).toFixed(1)}%
                                            </div>
                                        </div>
                                    ))}
                                    {(mlResults.featureImportance ?? []).length === 0 && (
                                        <div className="text-sm text-gray-500">No feature importance available.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MLTraining;