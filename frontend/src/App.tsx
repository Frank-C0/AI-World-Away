import React, { useState, useMemo } from 'react';
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

// Tipos
interface DataRow {
  id: number;
  nombre: string;
  edad: number;
  salario: number;
  ciudad: string;
  categoria: string;
  activo: boolean;
}

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
    <div className="flex gap-1 text-xs">
      <input
        type="number"
        placeholder={`Min (${min})`}
        className="w-16 px-1 py-1 border rounded"
        value={minValue ?? ''}
        onChange={(e) => setMinValue(e.target.value ? Number(e.target.value) : undefined)}
        onBlur={applyFilter}
      />
      <input
        type="number"
        placeholder={`Max (${max})`}
        className="w-16 px-1 py-1 border rounded"
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

// Datos de prueba ya limpios
const DATA: DataRow[] = [
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
  { id: 11, nombre: 'Sofía', edad: 30, salario: 3800, ciudad: 'Lima', categoria: 'C', activo: true },
  { id: 12, nombre: 'Lucía', edad: 25, salario: 2800, ciudad: 'Lima', categoria: 'B', activo: true },
  { id: 13, nombre: 'Ana', edad: 45, salario: 5500, ciudad: 'Lima', categoria: 'A', activo: true },
  { id: 14, nombre: 'Carlos', edad: 38, salario: 4900, ciudad: 'Arequipa', categoria: 'C', activo: false },
  { id: 15, nombre: 'Diego', edad: 22, salario: 2500, ciudad: 'Trujillo', categoria: 'B', activo: true },
];

const App: React.FC = () => {
  const [data] = useState<DataRow[]>(DATA);

  // Obtener valores únicos para filtros categóricos
  const getUniqueValues = (key: keyof DataRow): string[] => {
    return [...new Set(data.map((row) => String(row[key])))].sort();
  };

  // Obtener min/max para filtros numéricos
  const getMinMax = (key: keyof DataRow): [number, number] => {
    const values = data.map((row) => row[key] as number);
    return [Math.min(...values), Math.max(...values)];
  };

  // Definir columnas de TanStack Table
  const columns = useMemo<ColumnDef<DataRow>[]>(() => {
    const [minEdad, maxEdad] = getMinMax('edad');
    const [minSalario, maxSalario] = getMinMax('salario');

    return [
      {
        accessorKey: 'id',
        header: 'ID',
        size: 60,
      },
      {
        accessorKey: 'nombre',
        header: 'Nombre',
        filterFn: 'includesString',
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: 'edad',
        header: 'Edad',
        filterFn: numberRangeFilter,
        meta: { min: minEdad, max: maxEdad },
      },
      {
        accessorKey: 'salario',
        header: 'Salario',
        filterFn: numberRangeFilter,
        cell: (info) => `S/ ${(info.getValue() as number).toLocaleString()}`,
        meta: { min: minSalario, max: maxSalario },
      },
      {
        accessorKey: 'ciudad',
        header: 'Ciudad',
        filterFn: 'equals',
        meta: { options: getUniqueValues('ciudad') },
      },
      {
        accessorKey: 'categoria',
        header: 'Categoría',
        filterFn: 'equals',
        meta: { options: getUniqueValues('categoria') },
      },
      {
        accessorKey: 'activo',
        header: 'Activo',
        cell: (info) => (info.getValue() ? '✅' : '❌'),
        filterFn: 'equals',
        meta: { options: ['true', 'false'] },
      },
    ];
  }, [data]);

  // Configurar tabla
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-6 text-center">
          📋 Tabla Interactiva con Filtros
        </h1>
        <p className="text-sm text-gray-600 mt-1 mb-6 text-center">
          Usa los filtros en cada columna para buscar y ordenar datos específicos.
        </p>

        {/* Panel de controles */}
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={resetAllFilters}
              className="px-3 py-1.5 text-sm rounded border bg-white hover:bg-gray-50 shadow-sm transition disabled:opacity-40"
              disabled={table.getState().columnFilters.length === 0}
            >
              Limpiar filtros ({table.getState().columnFilters.length})
            </button>
          </div>
          <div className="w-full md:w-auto">
            <div className="px-3 py-2 bg-white rounded border shadow-sm">
              <p className="text-xs font-semibold text-gray-600 mb-2">Columnas</p>
              <div className="flex flex-wrap gap-3 max-w-xl">
                {table.getAllLeafColumns().map((col) => (
                  <label key={col.id} className="inline-flex items-center gap-1 text-xs cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={col.getIsVisible()}
                      onChange={col.getToggleVisibilityHandler()}
                    />
                    <span>{flexRender(col.columnDef.header, { table, column: col } as any)}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <React.Fragment key={headerGroup.id}>
                    {/* Fila de filtros - AHORA ENCIMA de los headers */}
                    <tr className="bg-gray-50 border-b">
                      {headerGroup.headers.map((header) => {
                        const column = header.column;
                        const isNumberRange = column.columnDef.filterFn === numberRangeFilter;
                        const options = (column.columnDef.meta as any)?.options as string[] | undefined;
                        return column.getIsVisible() ? (
                          <th key={`filter-${column.id}`} className="px-3 py-1 text-[11px] font-normal text-gray-600 align-top">
                            {column.getCanFilter() ? (
                              <details
                                className={`group rounded border border-dashed p-1 bg-white/60 hover:bg-white transition ${column.getIsFiltered() ? 'border-indigo-300' : 'border-gray-300'}`}
                                {...(column.getIsFiltered() ? { open: true } : {})}
                              >
                                <summary className="cursor-pointer list-none flex items-center justify-between gap-1 text-[11px] font-medium text-gray-700">
                                  <span className="truncate">Filtro</span>
                                  {column.getIsFiltered() && (
                                    <span className="text-[9px] px-1 py-0.5 rounded bg-indigo-100 text-indigo-700">✓</span>
                                  )}
                                </summary>
                                <div className="pt-1 space-y-1">
                                  {isNumberRange ? (
                                    <NumberRangeFilter
                                      column={column}
                                      min={(column.columnDef.meta as any)?.min}
                                      max={(column.columnDef.meta as any)?.max}
                                    />
                                  ) : options ? (
                                    <SelectFilter column={column} options={options} />
                                  ) : (
                                    <input
                                      type="text"
                                      className="w-full px-2 py-1 border rounded"
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
                              </details>
                            ) : <div className="h-8" />}
                          </th>
                        ) : null;
                      })}
                    </tr>
                    {/* Fila de headers - AHORA DEBAJO de los filtros */}
                    <tr className="bg-gray-100 border-b">
                      {headerGroup.headers.map((header) => (
                        <th key={header.id} className="px-4 py-2 text-left text-sm font-semibold text-gray-700 align-top">
                          <button
                            className="cursor-pointer select-none inline-flex items-center gap-1 group"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                            <span className="text-gray-400 group-hover:text-gray-600">
                              {{
                                asc: '▲',
                                desc: '▼',
                              }[header.column.getIsSorted() as string] ?? ''}
                            </span>
                          </button>
                        </th>
                      ))}
                    </tr>
                  </React.Fragment>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-b hover:bg-gray-50">
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
          <div className="p-4 bg-gray-50 border-t flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Mostrando {table.getRowModel().rows.length} de {table.getFilteredRowModel().rows.length} registros
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 text-sm"
              >
                ← Anterior
              </button>
              <span className="px-3 py-1 text-sm">
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
  );
};

export default App;