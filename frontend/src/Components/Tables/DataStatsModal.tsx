import React from 'react';
import type { DataStats } from '../../store/dataStore';
import { useDataStore } from '../../store/dataStore';

interface DataStatsModalProps {
  isOpen?: boolean; // legacy standalone usage
  onClose?: () => void; // legacy
  stats?: DataStats | null; // override stats
  embedded?: boolean; // new unified modal system
}

const DataStatsModal: React.FC<DataStatsModalProps> = ({ isOpen, onClose, stats, embedded = false }) => {
  const storeStats = useDataStore(s => s.stats);
  const finalStats = stats ?? storeStats;
  const visible = embedded ? !!finalStats : !!isOpen && !!finalStats;
  if (!visible || !finalStats) return null;

  const numeric = finalStats.columns.filter(c => c.isNumeric);
  const categorical = finalStats.columns.filter(c => c.isCategorical);
  const textCols = finalStats.columns.filter(c => !c.isNumeric && !c.isCategorical);

  if (!embedded) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-[500]">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">📊 Dataset Statistics</h2>
              <p className="text-blue-100 text-sm mt-1">Comprehensive analysis of dataset structure and content</p>
            </div>
            {onClose && (
              <button onClick={onClose} className="hover:bg-white/20 rounded-full p-2 transition">
                ✕
              </button>
            )}
          </div>
          <div className="p-6 overflow-y-auto flex-1">
            <EmbeddedContent stats={finalStats} numeric={numeric} categorical={categorical} textCols={textCols} dark={false} />
          </div>
        </div>
      </div>
    );
  }

  return <EmbeddedContent stats={finalStats} numeric={numeric} categorical={categorical} textCols={textCols} dark />;
};

interface EmbeddedContentProps {
  stats: DataStats;
  numeric: DataStats['columns'];
  categorical: DataStats['columns'];
  textCols: DataStats['columns'];
  dark?: boolean;
}

const EmbeddedContent: React.FC<EmbeddedContentProps> = ({ stats, numeric, categorical, textCols, dark = true }) => {
  const panel = dark ? 'rounded-lg border border-cyan-400/20 bg-cyan-400/5' : 'bg-white rounded-lg border border-gray-200 shadow';
  const sectionHead = dark ? 'text-cyan-200' : 'text-gray-800';
  const tableHead = dark ? 'bg-cyan-400/10 text-cyan-200' : 'bg-gray-50 text-gray-700';
  const divider = dark ? 'divide-cyan-400/10' : 'divide-gray-200';
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard label="Total Rows" value={stats.shape[0].toLocaleString()} icon="📋" gradient="from-cyan-600/60 to-cyan-400/40" />
        <SummaryCard label="Total Columns" value={stats.shape[1].toString()} icon="📊" gradient="from-purple-600/60 to-purple-400/40" />
        <SummaryCard label="Null Values" value={stats.totalNulls.toLocaleString()} icon="⚠️" gradient="from-amber-600/60 to-amber-400/40" />
        <SummaryCard label="Completeness" value={((1 - stats.totalNulls / (stats.shape[0]*stats.shape[1]))*100).toFixed(1)+"%"} icon="✅" gradient="from-emerald-600/60 to-emerald-400/40" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ColumnPanel title={`🔢 Numeric (${numeric.length})`} cols={numeric} panel={panel} sectionHead={sectionHead} dark={dark} type="numeric" />
        <ColumnPanel title={`🏷️ Categorical (${categorical.length})`} cols={categorical} panel={panel} sectionHead={sectionHead} dark={dark} type="categorical" />
        <ColumnPanel title={`📝 Text (${textCols.length})`} cols={textCols} panel={panel} sectionHead={sectionHead} dark={dark} type="text" />
      </div>

      <div className={panel}>
        <div className={`px-5 py-4 border-b ${dark ? 'border-cyan-400/20' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-semibold flex items-center gap-2 ${sectionHead}`}>
            <span className="text-2xl">📋</span>
            Detailed Column Summary
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={tableHead}>
              <tr>
                {['Column','Type','Category','Unique Values','Null Values','Range/Sample'].map(h => (
                  <th key={h} className="px-5 py-2 text-left text-[11px] uppercase tracking-wide font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className={divider}>
              {stats.columns.map((col, i) => (
                <tr key={col.name} className={dark ? 'hover:bg-cyan-400/5' : i % 2 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="px-5 py-2 font-medium">{col.name}</td>
                  <td className="px-5 py-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${dark ? 'bg-cyan-400/15 text-cyan-200' : 'bg-gray-100 text-gray-800'}`}>{col.dtype}</span>
                  </td>
                  <td className="px-5 py-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      col.isNumeric ? (dark ? 'bg-cyan-500/20 text-cyan-200' : 'bg-blue-100 text-blue-800') :
                      col.isCategorical ? (dark ? 'bg-cyan-500/20 text-cyan-200' : 'bg-green-100 text-green-800') :
                      (dark ? 'bg-cyan-500/20 text-cyan-200' : 'bg-yellow-100 text-yellow-800')
                    }`}>
                      {col.isNumeric ? 'Numeric' : col.isCategorical ? 'Categorical' : 'Text'}
                    </span>
                  </td>
                  <td className="px-5 py-2">{col.uniqueValues.length.toLocaleString()}</td>
                  <td className="px-5 py-2">{col.nullCount.toLocaleString()}</td>
                  <td className="px-5 py-2">
                    {col.isNumeric && col.min !== undefined && col.max !== undefined ? (
                      <span>{col.min.toLocaleString()} - {col.max.toLocaleString()}</span>
                    ) : col.isCategorical && col.uniqueValues.length <= 3 ? (
                      <span>{col.uniqueValues.slice(0,3).join(', ')}</span>
                    ) : <span className="opacity-50">-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const SummaryCard: React.FC<{label: string; value: string; icon: string; gradient: string;}> = ({label, value, icon, gradient}) => (
  <div className={`relative overflow-hidden rounded-lg border border-cyan-400/20 p-4 bg-gradient-to-br ${gradient}`}>
    <div className="flex items-center justify-between">
      <div>
        <h4 className="text-xs font-medium tracking-wide text-cyan-100/80 uppercase">{label}</h4>
        <p className="text-2xl font-bold mt-1 text-white drop-shadow-sm">{value}</p>
      </div>
      <div className="text-3xl opacity-80 select-none">{icon}</div>
    </div>
  </div>
);

const ColumnPanel: React.FC<{title: string; cols: DataStats['columns']; panel: string; sectionHead: string; dark: boolean; type: 'numeric'|'categorical'|'text';}> = ({title, cols, panel, sectionHead, dark, type}) => (
  <div className={`${panel} p-5`}>    
    <h3 className={`text-lg font-semibold mb-3 flex items-center gap-2 ${sectionHead}`}>{title}</h3>
    <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-1 text-sm">
      {cols.length ? cols.map(col => (
        <div key={col.name} className={`p-3 rounded-md border ${dark ? 'border-cyan-400/20 bg-cyan-400/5 text-cyan-100' : type==='numeric'? 'bg-blue-50 border-blue-200 text-blue-800' : type==='categorical' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-yellow-50 border-yellow-200 text-yellow-800'}`}>
          <div className="font-medium">{col.name}</div>
          <div className={`${dark ? 'text-cyan-200/80' : ''} text-xs mt-1 space-y-0.5`}>            
            <div>Type: {col.dtype}</div>
            {col.isNumeric && col.min !== undefined && col.max !== undefined && (
              <div>Range: {col.min.toLocaleString()} - {col.max.toLocaleString()}</div>
            )}
            {col.isCategorical && <div>Unique Values: {col.uniqueValues.length}</div>}
            <div>Null: {col.nullCount}</div>
            {col.isCategorical && col.uniqueValues.length <= 10 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {col.uniqueValues.map((v,i) => (
                  <span key={i} className={`${dark ? 'bg-cyan-400/15 text-cyan-200' : 'bg-green-100 text-green-700'} px-2 py-0.5 rounded text-[10px] font-medium`}>{v}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      )) : <p className="italic text-xs opacity-70">No columns available</p>}
    </div>
  </div>
);

export default DataStatsModal;
