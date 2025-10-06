import { create } from 'zustand';

// Reusable exported types
export interface DataRow { [key: string]: any }

export interface ColumnAnalysis {
  name: string;
  dtype: string;
  isNumeric: boolean;
  isCategorical: boolean;
  uniqueValues: string[];
  min?: number;
  max?: number;
  nullCount: number;
}

export interface DataStats {
  shape: number[];
  columns: ColumnAnalysis[];
  totalNulls: number;
}

// Compatibility with TanStack Table (used globally for table visibility)
export type VisibilityState = { [key: string]: boolean };
export type Updater<T> = T | ((old: T) => T);

// Data cleaning configuration
export interface CleaningStrategy {
  removeNulls: boolean;
  removeOutliers: boolean; // by quartiles
  fillStrategy: 'mean' | 'median' | 'mode' | 'forward' | 'backward' | 'drop';
  // For categorical: filter by specific values
  selectedCategories?: string[];
  // For categorical: group rare values
  groupRareCategories?: boolean;
  rareThreshold?: number; // percentage threshold to consider a category as rare
}

export interface ColumnTypeConfig {
  [columnName: string]: 'numeric' | 'categorical';
}

export interface DataCleaningConfig {
  removeDuplicates: boolean;
  selectedColumns: string[]; // columns selected for prediction/analysis
  targetColumn: string | null; // target column
  categoricalFilters: { [column: string]: string[] }; // filters by category
  columnStrategies: { [column: string]: CleaningStrategy }; // per-column strategies
  columnTypes: ColumnTypeConfig; // custom column types
  isEnabled: boolean; // whether cleaning is enabled
}

// Configuración de entrenamiento ML
export interface MLTrainingConfig {
  targetColumn: string | null;
  featureColumns: string[];
  testSize: number; // 0.2 = 20%
  valSize: number; // 0.2 = 20%
  useValAsTest: boolean;
  applyBalancing: boolean;
  balancingMethod: 'smote' | 'undersampling' | 'oversampling';
  categoricalEncoding: 'auto' | 'onehot' | 'label' | 'target';
  // Parámetros XGBoost
  maxDepth: number;
  nEstimators: number;
  learningRate: number;
  subsample: number;
  colsampleBytree: number;
  regAlpha: number; // L1 regularization
  regLambda: number; // L2 regularization
  scalePositiveWeight: number; // para balance de clases
  earlyStoppingRounds: number;
  randomState: number;
}

export interface MLResults {
  // Métricas de clasificación
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  confusionMatrix?: number[][];
  classNames?: string[];
  trainAccuracy?: number;
  valAccuracy?: number;
  
  // Métricas de regresión
  mse?: number;
  mae?: number;
  r2Score?: number;
  rmse?: number;
  trainR2?: number;
  valR2?: number;
  
  // Común
  featureImportance: { feature: string; importance: number }[];
  modelType: 'classification' | 'regression';
}

export interface GlobalDataState {
  data: DataRow[];            // Filas procesadas (puede ser limpia o cruda)
  rawRows: any | null;        // Copia original (por si se requiere)
  cleanedRows: DataRow[] | null; // Datos después de limpieza
  stats: DataStats | null;    // Análisis
  loading: boolean;           // Cargando dataset o pyodide
  error: string | null;       // Errores de carga/análisis
  columnVisibility: VisibilityState; // Preferencias UI tabla
  pyodideReady: boolean;      // Indica si pyodide terminó init en background
  cleaningConfig: DataCleaningConfig; // Configuración de limpieza
  showCleanedData: boolean;   // Ver datos limpios o crudos en tabla
  
  // ML Training
  mlConfig: MLTrainingConfig;
  mlResults: MLResults | null;
  mlTraining: boolean;

  // Basic setters
  setData: (data: DataRow[]) => void;
  setRawRows: (rows: any) => void;
  setStats: (stats: DataStats | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setColumnVisibility: (updater: Updater<VisibilityState>) => void;
  setPyodideReady: (ready: boolean) => void;
  setCleaningConfig: (config: Partial<DataCleaningConfig>) => void;
  setShowCleanedData: (show: boolean) => void;
  setCleanedRows: (rows: DataRow[] | null) => void;
  
  // ML Training
  setMLConfig: (config: Partial<MLTrainingConfig>) => void;
  setMLResults: (results: MLResults | null) => void;
  setMLTraining: (training: boolean) => void;
  trainXGBoostModel: () => Promise<void>;

  // Utilities
  generateSampleData: () => DataRow[];
  applyDataCleaning: () => Promise<void>;
  initializeColumnTypes: () => void;
  getEffectiveColumnType: (columnName: string) => 'numeric' | 'categorical';

  // Loading operations
  initPyodideEarly: () => Promise<void>; // background pre-load
  loadDataFromCSV: (csvUrl?: string) => Promise<void>;
  loadDataFromFile: (file: File) => Promise<void>;
  loadDataFromText: (csvText: string, virtualName?: string) => Promise<void>;
}

export const useDataStore = create<GlobalDataState>((set, get) => ({
  data: [],
  rawRows: null,
  cleanedRows: null,
  stats: null,
  loading: false,
  error: null,
  columnVisibility: {},
  pyodideReady: false,
  showCleanedData: false,
  cleaningConfig: {
    removeDuplicates: false,
    selectedColumns: [],
    targetColumn: null,
    categoricalFilters: {},
    columnStrategies: {},
    columnTypes: {},
    isEnabled: false,
  },
  
  // ML Training
  mlConfig: {
    targetColumn: null,
    featureColumns: [],
    testSize: 0.2,
    valSize: 0.2,
    useValAsTest: false,
    applyBalancing: false,
    balancingMethod: 'smote',
    categoricalEncoding: 'auto',
    maxDepth: 6,
    nEstimators: 100,
    learningRate: 0.1,
    subsample: 1.0,
    colsampleBytree: 1.0,
    regAlpha: 0,
    regLambda: 1,
    scalePositiveWeight: 1,
    earlyStoppingRounds: 10,
    randomState: 42,
  },
  mlResults: null,
  mlTraining: false,

  setData: (data) => set({ data }),
  setRawRows: (rawRows) => set({ rawRows }),
  setCleanedRows: (cleanedRows) => set({ cleanedRows }),
  setStats: (stats) => set({ stats }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setShowCleanedData: (showCleanedData) => {
    const state = get();
    set({ 
      showCleanedData,
      data: showCleanedData && state.cleanedRows ? state.cleanedRows : state.rawRows || []
    });
  },
  setCleaningConfig: (updates) => set(state => ({ 
    cleaningConfig: { ...state.cleaningConfig, ...updates } 
  })),
  setColumnVisibility: (updater) => {
    if (typeof updater === 'function') {
      set(state => ({ columnVisibility: (updater as (o: VisibilityState)=>VisibilityState)(state.columnVisibility) }));
    } else {
      set({ columnVisibility: updater });
    }
  },
  setPyodideReady: (pyodideReady) => set({ pyodideReady }),

  generateSampleData: () => [
    { id: 1, name: 'Ana', age: 45, salary: 5500, city: 'Lima', category: 'A', active: true },
    { id: 2, name: 'Juan', age: 28, salary: 3200, city: 'Arequipa', category: 'B', active: true },
    { id: 3, name: 'Maria', age: 35, salary: 4100, city: 'Cusco', category: 'C', active: false },
    { id: 4, name: 'Pedro', age: 50, salary: 6000, city: 'Trujillo', category: 'A', active: true },
    { id: 5, name: 'Lucia', age: 25, salary: 2800, city: 'Lima', category: 'B', active: true },
    { id: 6, name: 'Carlos', age: 38, salary: 4900, city: 'Arequipa', category: 'C', active: false },
    { id: 7, name: 'Elena', age: 42, salary: 5200, city: 'Cusco', category: 'A', active: true },
    { id: 8, name: 'Diego', age: 22, salary: 2500, city: 'Trujillo', category: 'B', active: true },
    { id: 9, name: 'Sofia', age: 30, salary: 3800, city: 'Lima', category: 'C', active: true },
    { id: 10, name: 'Miguel', age: 47, salary: 5800, city: 'Arequipa', category: 'A', active: false },
  ],

  initPyodideEarly: async () => {
    const { pyodideReady } = get();
    if (pyodideReady) return;
    try {
      const { pyodideContext } = await import('../pyodideClient');
      await pyodideContext.ready;
      set({ pyodideReady: true });
    } catch (e) {
      console.error('Failed initializing Pyodide', e);
    }
  },

  loadDataFromCSV: async (csvUrl = './final_data.csv') => {
    const { setLoading, setError, setRawRows, setStats, setData, generateSampleData } = get();
    try {
      setLoading(true); setError(null);
      const { pyodideContext } = await import('../pyodideClient');
      await pyodideContext.ready;
      const rows = await pyodideContext.loadCSV(csvUrl);
      setRawRows(rows);
      const analysis = pyodideContext.analyzeData(rows) as DataStats;
      setStats(analysis);
      setData(rows);
    } catch (err) {
      console.error('Error loading CSV:', err);
      setError(`Error loading CSV file: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setData(generateSampleData());
    } finally {
      setLoading(false);
    }
  },

  loadDataFromFile: async (file: File) => {
    const text = await file.text();
    return get().loadDataFromText(text, file.name);
  },

  loadDataFromText: async (csvText: string, virtualName = 'in-memory.csv') => {
    const { setLoading, setError, setRawRows, setStats, setData } = get();
    try {
      setLoading(true); setError(null);
      const { pyodideContext } = await import('../pyodideClient');
      await pyodideContext.ready;
      // Use the new safe parser (supports # comments)
      const jsRows = await pyodideContext.parseCSVText(csvText);
      setRawRows(jsRows);
      const analysis = pyodideContext.analyzeData(jsRows) as DataStats;
      setStats(analysis);
      setData(jsRows);
    } catch (err) {
      console.error('Error processing CSV text:', err);
      setError(`Error processing CSV text (${virtualName}): ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  },

  applyDataCleaning: async () => {
    const { rawRows, cleaningConfig, setCleanedRows, setError, showCleanedData, setData } = get();
    
    console.log('🧹 Starting data cleaning process...');
    console.log('Raw rows count:', rawRows?.length || 0);
    console.log('Cleaning config:', cleaningConfig);
    
    if (!rawRows || !cleaningConfig.isEnabled) {
      console.log('❌ Cleaning aborted: no raw rows or cleaning not enabled');
      return;
    }

    try {
      const { pyodideContext } = await import('../pyodideClient');
      await pyodideContext.ready;
      
      console.log('✅ Pyodide ready, calling cleanData...');
      
      // Send configuration to Python and apply cleaning
      const cleanedData = await pyodideContext.cleanData(rawRows, cleaningConfig);
      
      console.log('✅ Data cleaning completed');
      console.log('Cleaned rows count:', cleanedData?.length || 0);
      
      setCleanedRows(cleanedData);
      
      // If showing cleaned data, update the view
      if (showCleanedData) {
        console.log('🔄 Updating view with cleaned data');
        setData(cleanedData);
      }
    } catch (err) {
      console.error('❌ Error applying data cleaning:', err);
      setError(`Error applying data cleaning: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  },

  initializeColumnTypes: () => {
    const { stats, cleaningConfig, setCleaningConfig } = get();
    if (!stats) return;
    
    const columnTypes: ColumnTypeConfig = {};
    stats.columns.forEach(col => {
      // If there’s no previous config, use the automatically detected type
      if (!cleaningConfig.columnTypes[col.name]) {
        columnTypes[col.name] = col.isNumeric ? 'numeric' : 'categorical';
      } else {
        columnTypes[col.name] = cleaningConfig.columnTypes[col.name];
      }
    });
    
    setCleaningConfig({ columnTypes });
  },

  getEffectiveColumnType: (columnName: string) => {
    const { cleaningConfig, stats } = get();
    // Use custom type if defined, otherwise the auto-detected one
    if (cleaningConfig.columnTypes[columnName]) {
      return cleaningConfig.columnTypes[columnName];
    }
    const colAnalysis = stats?.columns.find(c => c.name === columnName);
    return colAnalysis?.isNumeric ? 'numeric' : 'categorical';
  },
  
  // ML Training functions
  setMLConfig: (updates) => set(state => ({ 
    mlConfig: { ...state.mlConfig, ...updates } 
  })),
  setMLResults: (mlResults) => set({ mlResults }),
  setMLTraining: (mlTraining) => set({ mlTraining }),
  
  trainXGBoostModel: async () => {
    const { data, mlConfig, setMLTraining, setMLResults, setError } = get();
    
    if (!data.length || !mlConfig.targetColumn || mlConfig.featureColumns.length === 0) {
      setError('Faltan datos o configuración para entrenar el modelo');
      return;
    }
    
    try {
      setMLTraining(true);
      setError(null);
      
      const { pyodideContext } = await import('../pyodideClient');
      await pyodideContext.ready;
      
      console.log('🤖 Iniciando entrenamiento XGBoost...');
      const results = await pyodideContext.trainXGBoost(data, mlConfig);
      
      console.log('✅ Entrenamiento completado:', results);
      setMLResults(results);
      
    } catch (err) {
      console.error('❌ Error entrenando modelo:', err);
      setError(`Error entrenando modelo: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setMLTraining(false);
    }
  },
}));
