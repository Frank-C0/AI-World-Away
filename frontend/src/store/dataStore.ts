import { create } from 'zustand';

// Tipos exportados reutilizables
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

// Para compatibilidad con TanStack Table (solo usado por tablas pero ahora global)
export type VisibilityState = { [key: string]: boolean };
export type Updater<T> = T | ((old: T) => T);

// Configuración de limpieza de datos
export interface CleaningStrategy {
  removeNulls: boolean;
  removeOutliers: boolean; // por cuartiles
  fillStrategy: 'mean' | 'median' | 'mode' | 'forward' | 'backward' | 'drop';
  // Para categóricas: filtrar por valores específicos
  selectedCategories?: string[];
  // Para categóricas: agrupar valores poco frecuentes
  groupRareCategories?: boolean;
  rareThreshold?: number; // umbral para considerar categoría como rara (porcentaje)
}

export interface ColumnTypeConfig {
  [columnName: string]: 'numeric' | 'categorical';
}

export interface DataCleaningConfig {
  removeDuplicates: boolean;
  selectedColumns: string[]; // columnas para predicción/análisis
  targetColumn: string | null; // columna objetivo
  categoricalFilters: { [column: string]: string[] }; // filtros por categoría
  columnStrategies: { [column: string]: CleaningStrategy }; // estrategias por columna
  columnTypes: ColumnTypeConfig; // tipos de columna personalizados
  isEnabled: boolean; // si está activa la limpieza
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

  // Setters básicos
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

  // Utilidades
  generateSampleData: () => DataRow[];
  applyDataCleaning: () => Promise<void>;
  initializeColumnTypes: () => void;
  getEffectiveColumnType: (columnName: string) => 'numeric' | 'categorical';

  // Operaciones de carga
  initPyodideEarly: () => Promise<void>; // pre-carga en background
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
    { id: 1, nombre: 'Ana', edad: 45, salario: 5500, ciudad: 'Lima', categoria: 'A', activo: true },
    { id: 2, nombre: 'Juan', edad: 28, salario: 3200, ciudad: 'Arequipa', categoria: 'B', activo: true },
    { id: 3, nombre: 'María', edad: 35, salario: 4100, ciudad: 'Cusco', categoria: 'C', activo: false },
    { id: 4, nombre: 'Pedro', edad: 50, salario: 6000, ciudad: 'Trujillo', categoria: 'A', activo: true },
    { id: 5, nombre: 'Lucía', edad: 25, salario: 2800, ciudad: 'Lima', categoria: 'B', activo: true },
    { id: 6, nombre: 'Carlos', edad: 38, salario: 4900, ciudad: 'Arequipa', categoria: 'C', activo: false },
    { id: 7, nombre: 'Elena', edad: 42, salario: 5200, ciudad: 'Cusco', categoria: 'A', activo: true },
    { id: 8, nombre: 'Diego', edad: 22, salario: 2500, ciudad: 'Trujillo', categoria: 'B', activo: true },
    { id: 9, nombre: 'Sofía', edad: 30, salario: 3800, ciudad: 'Lima', categoria: 'C', activo: true },
    { id: 10, nombre: 'Miguel', edad: 47, salario: 5800, ciudad: 'Arequipa', categoria: 'A', activo: false },
  ],

  initPyodideEarly: async () => {
    const { pyodideReady } = get();
    if (pyodideReady) return;
    try {
      const { pyodideContext } = await import('../pyodideClient');
      await pyodideContext.ready;
      set({ pyodideReady: true });
    } catch (e) {
      console.error('Fallo inicializando Pyodide', e);
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
      setError(`Error al cargar el archivo CSV: ${err instanceof Error ? err.message : 'Error desconocido'}`);
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
      // Usar nueva función segura (soporta comentarios #)
      const jsRows = await pyodideContext.parseCSVText(csvText);
      setRawRows(jsRows);
      const analysis = pyodideContext.analyzeData(jsRows) as DataStats;
      setStats(analysis);
      setData(jsRows);
    } catch (err) {
      console.error('Error procesando CSV directo:', err);
      setError(`Error procesando el texto CSV (${virtualName}): ${err instanceof Error ? err.message : 'Error desconocido'}`);
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
      
      // Enviar configuración a Python y aplicar limpieza
      const cleanedData = await pyodideContext.cleanData(rawRows, cleaningConfig);
      
      console.log('✅ Data cleaning completed');
      console.log('Cleaned rows count:', cleanedData?.length || 0);
      
      setCleanedRows(cleanedData);
      
      // Si estamos mostrando datos limpios, actualizamos la vista
      if (showCleanedData) {
        console.log('🔄 Updating view with cleaned data');
        setData(cleanedData);
      }
    } catch (err) {
      console.error('❌ Error applying data cleaning:', err);
      setError(`Error aplicando limpieza de datos: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  },

  initializeColumnTypes: () => {
    const { stats, cleaningConfig, setCleaningConfig } = get();
    if (!stats) return;
    
    const columnTypes: ColumnTypeConfig = {};
    stats.columns.forEach(col => {
      // Si no hay configuración previa, usar el tipo detectado automáticamente
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
    // Usar tipo personalizado si existe, sino el detectado automáticamente
    if (cleaningConfig.columnTypes[columnName]) {
      return cleaningConfig.columnTypes[columnName];
    }
    const colAnalysis = stats?.columns.find(c => c.name === columnName);
    return colAnalysis?.isNumeric ? 'numeric' : 'categorical';
  },
}));
