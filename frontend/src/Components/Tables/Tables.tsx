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

import { useDataStore } from '../../store/dataStore';
import type { DataRow } from '../../store/dataStore';

// === 🔹 Mapeo de nombres legibles para las columnas ===
const COLUMN_LABELS: Record<string, string> = {
  kepid: 'Kepler ID',
  koi_name: 'KOI Name',
  kepler_name: 'Kepler Name',
  koi_disposition: 'Exoplanet Archive Disposition',
  koi_score: 'Disposition Score',
  koi_fpflag_nt: 'Not Transit-Like (False Positive Flag)',
  koi_fpflag_ss: 'Stellar Eclipse (False Positive Flag)',
  koi_fpflag_co: 'Centroid Offset (False Positive Flag)',
  koi_fpflag_ec: 'Ephemeris Match Indicates Contamination',
  ra: 'Right Ascension',
  dec: 'Declination',
  koi_depth: 'Transit Depth',
  koi_duration: 'Transit Duration (hrs)',
  koi_impact: 'Impact Parameter',
  koi_insol: 'Insolation Flux',
  koi_kepmag: 'Kepler Magnitude',
  koi_model_snr: 'Signal-to-Noise Ratio',
  koi_period: 'Orbital Period (days)',
  koi_prad: 'Planetary Radius (R⊕)',
  koi_slogg: 'Surface Gravity (log g)',
  koi_srad: 'Stellar Radius (R☉)',
  koi_steff: 'Stellar Effective Temperature (K)',
  koi_teq: 'Equilibrium Temperature (K)',
  koi_time0bk: 'Time of First Transit (BKJD)',
};

// === 🔹 Descripciones breves para cada parámetro ===
const COLUMN_DESCRIPTIONS: Record<string, string> = {
  ra: "Right Ascension: celestial coordinate that measures the object's position east–west in the sky. Used to locate stars or planets on the celestial sphere.",
  dec: "Declination: celestial coordinate that measures the object's position north–south in the sky. Used together with right ascension to define precise positions.",
  koi_depth: "Transit Depth: amount of starlight blocked during a transit. Used to estimate the planet’s size relative to its star.",
  koi_disposition: "Exoplanet Archive Disposition: classification assigned by the Kepler team based on observed data. Used to determine if the candidate is a confirmed planet, false positive, or candidate.",
  koi_duration: "Transit Duration (hrs): total time in hours that the planet takes to cross its star. Used to analyze orbital geometry and star–planet interaction.",
  koi_fpflag_co: "Centroid Offset (False Positive Flag): indicates if the light centroid shifts during transit, suggesting contamination or background stars. Used for false positive detection.",
  koi_fpflag_ec: "Ephemeris Match (Contamination Flag): marks a match with another known signal, indicating possible contamination. Used to identify duplicates or blending sources.",
  koi_fpflag_nt: "Not Transit-Like (False Positive Flag): flags signals that do not resemble a true planetary transit. Used for filtering non-planetary events.",
  koi_fpflag_ss: "Stellar Eclipse (False Positive Flag): indicates that the event might be caused by a stellar binary eclipse rather than a planet. Used in candidate vetting.",
  koi_impact: "Impact Parameter: measures how centrally the planet crosses the stellar disk (0 = center, 1 = grazing). Used to model light curves and orbital inclination.",
  koi_insol: "Insolation Flux: amount of stellar energy received by the planet. Used to estimate surface temperature and habitability.",
  koi_kepmag: "Kepler Magnitude: apparent brightness of the star observed by Kepler. Used to determine signal strength and detection limits.",
  koi_model_snr: "Signal-to-Noise Ratio: ratio between the detected signal and background noise. Used to evaluate detection confidence.",
  koi_period: "Orbital Period (days): number of days the planet takes to complete one orbit around its star. Used to calculate distance and orbital velocity.",
  koi_prad: "Planetary Radius (R⊕): estimated size of the planet in Earth radii. Used to classify planets as Earth-like, Neptune-like, etc.",
  koi_score: "Disposition Score: probability that the candidate is a genuine exoplanet. Used to rank reliability among detections.",
  koi_slogg: "Surface Gravity (log g): logarithmic measure of stellar surface gravity. Used to infer star type and evolutionary state.",
  koi_srad: "Stellar Radius (R☉): radius of the host star in solar radii. Used to estimate planetary radius and orbital distance.",
  koi_steff: "Stellar Effective Temperature (K): temperature of the star’s photosphere in kelvins. Used to model the system’s energy balance.",
  koi_teq: "Equilibrium Temperature (K): estimated planetary temperature assuming radiative equilibrium. Used to assess habitability potential.",
  koi_time0bk: "Time of First Transit (BKJD): the first recorded mid-transit time in Barycentric Kepler Julian Date. Used as a time reference for transit predictions.",
};


// === 🔹 Filtro personalizado numérico ===
const numberRangeFilter: FilterFn<any> = (row, columnId, filterValue) => {
  const value = row.getValue(columnId) as number;
  const [min, max] = filterValue as [number | undefined, number | undefined];
  if (min !== undefined && value < min) return false;
  if (max !== undefined && value > max) return false;
  return true;
};

// === 🔹 Filtro de rango numérico ===
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

// === 🔹 Filtro de selección (para categorías) ===
const SelectFilter = ({ column, options }: any) => {
  return (
    <select
      className="w-full px-2 py-1 text-xs border rounded"
      value={(column.getFilterValue() as string) ?? ''}
      onChange={(e) => column.setFilterValue(e.target.value || undefined)}
    >
      <option value="">All</option>
      {options.map((option: string) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
};

// === 🔹 Componente Tooltip simple ===
const InfoTooltip = ({ text }: { text: string }) => {
  const [visible, setVisible] = useState(false);
  return (
    <span className="relative inline-block ml-1">
      <button
        onClick={() => setVisible(!visible)}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        className="text-xs bg-blue-200 text-blue-800 rounded-full w-4 h-4 flex items-center justify-center font-bold"
      >
        ?
      </button>
      {visible && (
        <div className="absolute z-10 left-5 top-0 w-64 bg-white border border-gray-300 text-gray-700 text-xs rounded p-2 shadow-lg">
          {text}
        </div>
      )}
    </span>
  );
};

const Tables: React.FC = () => {
  const { data, stats, loading, error, columnVisibility, setColumnVisibility, loadDataFromCSV } = useDataStore();

  const columns = useMemo<ColumnDef<DataRow>[]>(() => {
    if (!stats) return [];

    return stats.columns.map((colAnalysis) => {
      const label = COLUMN_LABELS[colAnalysis.name] || colAnalysis.name;
      const description = COLUMN_DESCRIPTIONS[colAnalysis.name];

      const baseColumn: ColumnDef<DataRow> = {
        accessorKey: colAnalysis.name,
        header: () => (
          <div className="flex items-center gap-1">
            <span>{label}</span>
            {description && <InfoTooltip text={description} />}
          </div>
        ),
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
          meta: { min: colAnalysis.min, max: colAnalysis.max, isNumeric: true },
        };
      } else if (colAnalysis.isCategorical) {
        return {
          ...baseColumn,
          filterFn: 'equals',
          meta: { options: colAnalysis.uniqueValues, isCategorical: true },
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
    initialState: { pagination: { pageSize: 10 } },
  });

  const resetAllFilters = () => table.resetColumnFilters();
  const reloadData = () => loadDataFromCSV();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">Loading data...</p>
        </div>
      </div>
    );
  }

  if (!data.length) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-gray-700 mb-2">No data loaded</h2>
        <p className="text-gray-600 mb-4 text-sm">
          Use the <span className="font-semibold">"🗂️ Data"</span> modal to upload a CSV file, paste text, or provide a URL.
        </p>
        <button
          onClick={() => loadDataFromCSV()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium"
        >
          Try loading default dataset
        </button>
      </div>
    </div>
  );
}

return (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Dynamic Table with Data Analysis</h1>
        <p className="text-gray-600"></p>
      </div>

      {error && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <p className="text-yellow-800 font-medium">{error}</p>
              <p className="text-yellow-700 text-sm mt-1">
                Example data is being displayed. Please verify that the file 'final_data.csv' is in the public folder.
              </p>
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
              Clean Filters ({table.getState().columnFilters.length})
            </button>
            <button
              onClick={reloadData}
              className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium transition text-sm"
            >
              🔄 Reload Data
            </button>

            <details className="relative ml-auto">
              <summary className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer font-medium text-sm list-none">
                Columns
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
                    {/* Fila de filtros */}
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
                                  Filter
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
                                      Remove
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : <div className="h-12"></div>}
                          </th>
                        ) : null;
                      })}
                    </tr>

                    {/* Fila de headers */}
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
                Showing {table.getRowModel().rows.length} de {table.getFilteredRowModel().rows.length} registers
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="px-3 py-1  bg-blue-950 hover:bg-blue-900 disabled:opacity-50 text-sm"
                >
                  ← Back
                </button>
                <span className="text-gray-700">
                  Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </span>
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="px-3 py-1 bg-blue-950 hover:bg-blue-900 disabled:opacity-50 text-sm"
                >
                  Next →
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
