import { create } from 'zustand';

// Tipos exportados para ser reutilizados
export interface DataRow {
  [key: string]: any;
}

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

// Para compatibilidad con TanStack Table
export type VisibilityState = {
  [key: string]: boolean;
};

export type Updater<T> = T | ((old: T) => T);

export interface TableState {
  // Datos y estado
  data: DataRow[];
  rawRows: any | null;
  stats: DataStats | null;
  loading: boolean;
  error: string | null;
  columnVisibility: VisibilityState;

  // Acciones
  setData: (data: DataRow[]) => void;
  setRawRows: (rows: any) => void;
  setStats: (stats: DataStats | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setColumnVisibility: (updater: Updater<VisibilityState>) => void;
  
  // Funciones
  generateSampleData: () => DataRow[];
  loadDataFromCSV: (csvUrl?: string) => Promise<void>;
}

export const useTableStore = create<TableState>((set, get) => ({
  // Estado inicial
  data: [],
  rawRows: null,
  stats: null,
  loading: true,
  error: null,
  columnVisibility: {},

  // Setters para el estado
  setData: (data) => set({ data }),
  setRawRows: (rawRows) => set({ rawRows }),
  setStats: (stats) => set({ stats }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setColumnVisibility: (updater) => {
    if (typeof updater === 'function') {
      set((state) => ({ 
        columnVisibility: (updater as (old: VisibilityState) => VisibilityState)(state.columnVisibility) 
      }));
    } else {
      set({ columnVisibility: updater });
    }
  },

  // Generar datos de ejemplo
  generateSampleData: () => {
    return [
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
    ];
  },

  // Cargar y procesar datos desde CSV
  loadDataFromCSV: async (csvUrl = './final_data.csv') => {
    const { generateSampleData, setData, setRawRows, setStats, setLoading, setError } = get();
    try {
      setLoading(true);
      setError(null);

      // Importamos pyodideContext directamente
      // En producción, sería mejor inyectarlo como dependencia
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
      
      // Datos de ejemplo en caso de error
      const sampleData = generateSampleData();
      setData(sampleData);
    } finally {
      setLoading(false);
    }
  },
}));