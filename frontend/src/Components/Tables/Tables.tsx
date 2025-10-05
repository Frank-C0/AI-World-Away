import React, { useState, useMemo, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type FilterFn,
} from '@tanstack/react-table';

// Importamos la store con sus tipos
import { useTableStore } from '../../store/tableStore';
import type { DataRow } from '../../store/tableStore';

// Filtro personalizado para rangos numéricos
const numberRangeFilter: FilterFn<any> = (row, columnId, filterValue) => {
  const value = row.getValue(columnId) as number;
  const [min, max] = filterValue as [number | undefined, number | undefined];
  if (min !== undefined && value < min) return false;
  if (max !== undefined && value > max) return false;
  return true;
};

// Componente de filtro para columnas numéricas
const NumberRangeFilter = ({ column, min, max }: any) => {
  const [minValue, setMinValue] = useState<number | undefined>(undefined);
  const [maxValue, setMaxValue] = useState<number | undefined>(undefined);

  const applyFilter = () => {
    column.setFilterValue([minValue, maxValue]);
  };

  return (
    <div className="flex gap-1">
      <input
        type="number"
        placeholder={`Min (${min})`}
        className="w-20 px-2 py-1 text-xs border rounded"
        value={minValue ?? ''}
        onChange={(e) => setMinValue(e.target.value ? Number(e.target.value) : undefined)}
        onBlur={applyFilter}
      />
      <input
        type="number"
        placeholder={`Max (${max})`}
        className="w-20 px-2 py-1 text-xs border rounded"
        value={maxValue ?? ''}
        onChange={(e) => setMaxValue(e.target.value ? Number(e.target.value) : undefined)}
        onBlur={applyFilter}
      />
    </div>
  );
};

// Componente de filtro para columnas categóricas
const SelectFilter = ({ column, options }: any) => {
  return (
    <select
      className="w-full px-2 py-1 text-xs border rounded"
      value={(column.getFilterValue() as string) ?? ''}
      onChange={(e) => column.setFilterValue(e.target.value || undefined)}
    >
      <option value="">Todos</option>
      {options.map((option: string) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
};

const Tables: React.FC = () => {
  // Usar el estado desde Zustand
  const { 
    data, 
    stats, 
    loading, 
    error, 
    columnVisibility,
    setColumnVisibility,
    loadDataFromCSV
  } = useTableStore();

  // La función loadDataFromCSV ahora se maneja desde la store

  // Cargar datos al montar el componente
  useEffect(() => {
    loadDataFromCSV();
  }, [loadDataFromCSV]);

  // Definir columnas dinámicamente
  const columns = useMemo<ColumnDef<DataRow>[]>(() => {
    if (!stats) return [];

    return stats.columns.map((colAnalysis) => {
      const baseColumn: ColumnDef<DataRow> = {
        accessorKey: colAnalysis.name,
        header: colAnalysis.name,
        cell: (info) => {
          const value = info.getValue();
          if (value === null || value === undefined) {
            return <span className="text-gray-400 italic">N/A</span>;
          }
          
          if (colAnalysis.isNumeric && typeof value === 'number') {
            return <span className="font-mono">{value.toLocaleString()}</span>;
          }
          
          if (typeof value === 'boolean') {
            return value ? '✅' : '❌';
          }
          
          return String(value);
        },
      };

      if (colAnalysis.isNumeric) {
        return {
          ...baseColumn,
          filterFn: numberRangeFilter,
          meta: { 
            min: colAnalysis.min, 
            max: colAnalysis.max,
            isNumeric: true 
          },
        };
      } else if (colAnalysis.isCategorical) {
        return {
          ...baseColumn,
          filterFn: 'equals',
          meta: { 
            options: colAnalysis.uniqueValues,
            isCategorical: true 
          },
        };
      } else {
        return {
          ...baseColumn,
          filterFn: 'includesString',
          meta: { isText: true },
        };
      }
    });
  }, [stats]);

  const table = useReactTable({
    data,
    columns,
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  const resetAllFilters = () => {
    table.resetColumnFilters();
  };

  const reloadData = () => {
    loadDataFromCSV();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Tabla Dinámica con Análisis de Datos
          </h1>
          <p className="text-gray-600">
            Datos cargados desde CSV y analizados automáticamente con Pyodide (Python)
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <p className="text-yellow-800 font-medium">{error}</p>
                <p className="text-yellow-700 text-sm mt-1">
                  Se están mostrando datos de ejemplo. Verifica que el archivo 'final_data.csv' esté en la carpeta pública.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Panel de estadísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Resumen del Dataset</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Filas:</span>
                  <span className="font-semibold">{stats.shape[0]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Columnas:</span>
                  <span className="font-semibold">{stats.shape[1]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Valores nulos:</span>
                  <span className="font-semibold text-red-600">{stats.totalNulls}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Columnas Numéricas</h3>
              <div className="space-y-2 text-xs">
                {stats.columns.filter(col => col.isNumeric).length > 0 ? (
                  stats.columns.filter(col => col.isNumeric).map(col => (
                    <div key={col.name} className="flex justify-between">
                      <span className="text-gray-600 font-medium">{col.name}:</span>
                      <span className="text-gray-800">
                        {col.min !== undefined && col.max !== undefined ? 
                          `${col.min} - ${col.max}` : 'N/A'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 italic">No hay columnas numéricas</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Columnas Categóricas</h3>
              <div className="space-y-2 text-xs">
                {stats.columns.filter(col => col.isCategorical).length > 0 ? (
                  stats.columns.filter(col => col.isCategorical).map(col => (
                    <div key={col.name} className="flex justify-between">
                      <span className="text-gray-600 font-medium">{col.name}:</span>
                      <span className="text-gray-800">{col.uniqueValues.length} valores</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 italic">No hay columnas categóricas</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Panel de controles */}
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200 mb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <button
              onClick={resetAllFilters}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition text-sm"
            >
              Limpiar filtros ({table.getState().columnFilters.length})
            </button>
            <button
              onClick={reloadData}
              className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium transition text-sm"
            >
              🔄 Recargar Datos
            </button>

            <details className="relative ml-auto">
              <summary className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer font-medium text-sm list-none">
                Columnas
              </summary>
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10 max-h-64 overflow-y-auto">
                {table.getAllLeafColumns().map((col) => (
                  <label key={col.id} className="flex items-center gap-2 py-1 hover:bg-gray-50 px-2 rounded cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={col.getIsVisible()}
                      onChange={col.getToggleVisibilityHandler()}
                      className="rounded"
                    />
                    <span>{flexRender(col.columnDef.header, { table, column: col } as any)}</span>
                  </label>
                ))}
              </div>
            </details>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                {table.getHeaderGroups().map((headerGroup) => (
                  <React.Fragment key={headerGroup.id}>
                    {/* Fila de filtros - ENCIMA */}
                    <tr className="bg-blue-500">
                      {headerGroup.headers.map((header) => {
                        const column = header.column;
                        const meta = column.columnDef.meta as any;
                        const isNumberRange = meta?.isNumeric;
                        const options = meta?.options as string[] | undefined;

                        return column.getIsVisible() ? (
                          <th key={header.id} className="px-4 py-2 text-left">
                            {column.getCanFilter() ? (
                              <div className="space-y-1">
                                <div className="text-[10px] font-normal opacity-80">
                                  Filtro
                                  {column.getIsFiltered() && (
                                    <span className="ml-1 text-yellow-300">✓</span>
                                  )}
                                </div>
                                <div>
                                  {isNumberRange ? (
                                    <NumberRangeFilter column={column} min={meta.min} max={meta.max} />
                                  ) : options ? (
                                    <SelectFilter column={column} options={options} />
                                  ) : (
                                    <input
                                      className="w-full px-2 py-1 text-xs border rounded text-gray-800"
                                      placeholder="Buscar..."
                                      value={(column.getFilterValue() as string) ?? ''}
                                      onChange={(e) => column.setFilterValue(e.target.value)}
                                    />
                                  )}
                                  {column.getIsFiltered() && (
                                    <button
                                      onClick={() => column.setFilterValue(undefined)}
                                      className="block w-full text-[10px] text-gray-500 hover:text-gray-700 underline"
                                    >
                                      Quitar
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : <div className="h-12"></div>}
                          </th>
                        ) : null;
                      })}
                    </tr>

                    {/* Fila de headers - DEBAJO */}
                    <tr>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-blue-700 transition"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <div className="flex items-center gap-2">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            <span className="text-xs">
                              {{
                                asc: '▲',
                                desc: '▼',
                              }[header.column.getIsSorted() as string] ?? ''}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </React.Fragment>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-200">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-blue-50 transition">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 text-sm text-gray-700">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <div className="text-gray-600">
                Mostrando {table.getRowModel().rows.length} de {table.getFilteredRowModel().rows.length} registros
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 text-sm"
                >
                  ← Anterior
                </button>
                <span className="text-gray-700">
                  Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
                </span>
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 text-sm"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tables;