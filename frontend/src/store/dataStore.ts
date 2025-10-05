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

export interface GlobalDataState {
  data: DataRow[];            // Filas procesadas
  rawRows: any | null;        // Copia original (por si se requiere)
  stats: DataStats | null;    // Análisis
  loading: boolean;           // Cargando dataset o pyodide
  error: string | null;       // Errores de carga/análisis
  columnVisibility: VisibilityState; // Preferencias UI tabla
  pyodideReady: boolean;      // Indica si pyodide terminó init en background

  // Setters básicos
  setData: (data: DataRow[]) => void;
  setRawRows: (rows: any) => void;
  setStats: (stats: DataStats | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setColumnVisibility: (updater: Updater<VisibilityState>) => void;
  setPyodideReady: (ready: boolean) => void;

  // Utilidades
  generateSampleData: () => DataRow[];

  // Operaciones de carga
  initPyodideEarly: () => Promise<void>; // pre-carga en background
  loadDataFromCSV: (csvUrl?: string) => Promise<void>;
  loadDataFromFile: (file: File) => Promise<void>;
  loadDataFromText: (csvText: string, virtualName?: string) => Promise<void>;
}

export const useDataStore = create<GlobalDataState>((set, get) => ({
  data: [],
  rawRows: null,
  stats: null,
  loading: false,
  error: null,
  columnVisibility: {},
  pyodideReady: false,

  setData: (data) => set({ data }),
  setRawRows: (rawRows) => set({ rawRows }),
  setStats: (stats) => set({ stats }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
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
      // Reusar parse_csv definido en Python sin necesidad de fetch
      (pyodideContext as any)._pyodide?.globals.set?.('___csv_text_direct', csvText);
      const rows = await (pyodideContext as any)._pyodide.runPythonAsync('parse_csv(___csv_text_direct)');
      const jsRows = rows.toJs ? rows.toJs({}) : rows;
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
}));
