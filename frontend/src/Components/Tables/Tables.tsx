import React, { useState, useEffect, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  flexRender,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table';
import { pyodideContext } from '../../pyodideClient';

// 📊 TIPOS DE DATOS
interface DataRow {
  [key: string]: string | number | boolean | null;
}

interface Stats {
  totalRows: number;
  totalColumns: number;
  numericColumns: number;
  categoricalColumns: number;
  missingValues: number;
}

interface ColumnMetadata {
  name: string;
  type: 'numeric' | 'categorical' | 'text';
  uniqueValues?: string[];
  min?: number;
  max?: number;
}

// 🎨 COMPONENTE PRINCIPAL
const Tables: React.FC = () => {
  // Estados principales
  const [data, setData] = useState<DataRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [columnMetadata, setColumnMetadata] = useState<ColumnMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de la tabla
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState('');

  // 🔄 CARGA DE DATOS CON PYODIDE
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔄 Inicializando Pyodide...');
        
        // Esperar a que Pyodide esté listo
        await pyodideContext.ready;
        
        console.log('✅ Pyodide listo, cargando CSV...');
        
        // Cargar CSV usando el método del pyodideClient
        const rows = await pyodideContext.loadCSV('/final_data.csv');
        
        console.log('✅ CSV cargado:', rows.length, 'filas');
        
        // Analizar datos usando el método analyzeData
        const analysis = pyodideContext.analyzeData(rows);
        
        console.log('✅ Análisis completo:', analysis);
        
        // Procesar el análisis de Pyodide
        const [totalRows, totalColumns] = analysis.shape;
        const columns = analysis.columns || [];
        
        // Convertir metadata de columnas al formato esperado
        const metadata: ColumnMetadata[] = columns.map((col: any) => ({
          name: col.name,
          type: col.isNumeric ? 'numeric' : (col.isCategorical ? 'categorical' : 'text'),
          uniqueValues: col.uniqueValues || [],
          min: col.min,
          max: col.max
        }));
        
        // Calcular estadísticas
        const numericCols = columns.filter((c: any) => c.isNumeric).length;
        const categoricalCols = columns.filter((c: any) => c.isCategorical).length;
        
        // Actualizar estados
        setData(rows);
        setStats({
          totalRows,
          totalColumns,
          numericColumns: numericCols,
          categoricalColumns: categoricalCols,
          missingValues: analysis.totalNulls || 0
        });
        setColumnMetadata(metadata);
        
        console.log('📊 Datos cargados exitosamente');

      } catch (err) {
        console.error('❌ Error cargando datos:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // 📋 DEFINICIÓN DE COLUMNAS DINÁMICAS
  const columns = useMemo<ColumnDef<DataRow>[]>(() => {
    if (columnMetadata.length === 0) return [];

    return columnMetadata.map((col) => ({
      accessorKey: col.name,
      header: () => (
        <div className="flex items-center gap-2">
          <span className="font-semibold">{col.name}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
            {col.type}
          </span>
        </div>
      ),
      cell: (info) => {
        const value = info.getValue();
        
        // Formateo según tipo
        if (col.type === 'numeric' && typeof value === 'number') {
          return (
            <span className="font-mono text-sm">
              {value.toFixed(2)}
            </span>
          );
        }
        
        if (col.type === 'categorical') {
          return (
            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
              {String(value)}
            </span>
          );
        }
        
        return <span className="text-gray-700">{String(value)}</span>;
      },
      filterFn: col.type === 'numeric' ? 'inNumberRange' : 'includesString',
      enableColumnFilter: true,
      enableSorting: true,
    }));
  }, [columnMetadata]);

  // ⚙️ CONFIGURACIÓN DE LA TABLA
  const table = useReactTable({
    data,
    columns,
    state: {
      columnFilters,
      sorting,
      columnVisibility,
      globalFilter,
    },
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  // 🎯 COMPONENTE: Panel de Estadísticas
  const StatsPanel = () => (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
        <div className="text-sm text-blue-600 font-medium">Total Filas</div>
        <div className="text-2xl font-bold text-blue-900">{stats?.totalRows || 0}</div>
      </div>
      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
        <div className="text-sm text-green-600 font-medium">Columnas</div>
        <div className="text-2xl font-bold text-green-900">{stats?.totalColumns || 0}</div>
      </div>
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
        <div className="text-sm text-purple-600 font-medium">Numéricas</div>
        <div className="text-2xl font-bold text-purple-900">{stats?.numericColumns || 0}</div>
      </div>
      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
        <div className="text-sm text-orange-600 font-medium">Categóricas</div>
        <div className="text-2xl font-bold text-orange-900">{stats?.categoricalColumns || 0}</div>
      </div>
      <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
        <div className="text-sm text-red-600 font-medium">Valores Nulos</div>
        <div className="text-2xl font-bold text-red-900">{stats?.missingValues || 0}</div>
      </div>
    </div>
  );

  // 🎯 COMPONENTE: Controles de Filtrado
  const FilterControls = () => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Búsqueda Global */}
        <div className="flex-1">
          <input
            type="text"
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="🔍 Buscar en todas las columnas..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Selector de Visibilidad */}
        <div className="relative">
          <details className="group">
            <summary className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer font-medium text-gray-700 list-none">
              👁️ Columnas Visibles ({Object.values(columnVisibility).filter(Boolean).length || table.getAllLeafColumns().length})
            </summary>
            <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10 max-h-96 overflow-y-auto">
              {table.getAllLeafColumns().map((column) => (
                <label key={column.id} className="flex items-center gap-2 py-2 hover:bg-gray-50 px-2 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={column.getIsVisible()}
                    onChange={column.getToggleVisibilityHandler()}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{column.id}</span>
                </label>
              ))}
            </div>
          </details>
        </div>

        {/* Botón Limpiar Filtros */}
        {(columnFilters.length > 0 || globalFilter) && (
          <button
            onClick={() => {
              setColumnFilters([]);
              setGlobalFilter('');
            }}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition"
          >
            🗑️ Limpiar Filtros
          </button>
        )}
      </div>
    </div>
  );

  // 🎯 RENDERIZADO PRINCIPAL
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">Cargando datos...</p>
          <p className="text-sm text-gray-500 mt-2">Inicializando Pyodide y procesando CSV</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error al cargar datos</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
          >
            🔄 Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            📊 Explorador de Datos Avanzado
          </h1>
          <p className="text-gray-600">
            Visualización interactiva con análisis en tiempo real
          </p>
        </div>

        {/* Estadísticas */}
        {stats && <StatsPanel />}

        {/* Controles */}
        <FilterControls />

        {/* Tabla */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-6 py-4 text-left text-sm font-semibold cursor-pointer hover:bg-blue-700 transition"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center gap-2">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {{
                            asc: ' 🔼',
                            desc: ' 🔽',
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-200">
                {table.getRowModel().rows.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={`${
                      idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    } hover:bg-blue-50 transition`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4 text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                  className="px-3 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                >
                  ⏮️
                </button>
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="px-3 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                >
                  ◀️
                </button>
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="px-3 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                >
                  ▶️
                </button>
                <button
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                  className="px-3 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                >
                  ⏭️
                </button>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-700">
                  Página{' '}
                  <strong>
                    {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
                  </strong>
                </span>
                <select
                  value={table.getState().pagination.pageSize}
                  onChange={(e) => table.setPageSize(Number(e.target.value))}
                  className="px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {[10, 20, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      Mostrar {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Mostrando {table.getRowModel().rows.length} de{' '}
          {table.getFilteredRowModel().rows.length} filas filtradas
          ({data.length} total)
        </div>
      </div>
    </div>
  );
};

export default Tables;