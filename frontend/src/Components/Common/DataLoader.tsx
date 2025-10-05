import React, { useRef, useState } from 'react';
import { useDataStore } from '../../store/dataStore';

const DataLoader: React.FC = () => {
  const inputRef = useRef<HTMLInputElement|null>(null);
  const { loadDataFromCSV, loadDataFromFile, loadDataFromText, loading, error, stats, data, pyodideReady } = useDataStore();
  const [url, setUrl] = useState('./final_data.csv');
  const [dragActive, setDragActive] = useState(false);
  const [rawPreview, setRawPreview] = useState<string>('');

  const handleUrlLoad = async (e: React.FormEvent) => {
    e.preventDefault();
    await loadDataFromCSV(url);
  };

  const handleFile = async (file: File) => {
    const text = await file.text();
    setRawPreview(text.split('\n').slice(0,6).join('\n'));
    await loadDataFromFile(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const loadSample = () => loadDataFromCSV('./final_data.csv');

  const exampleText = `col1,col2,col3\n1,a,10\n2,b,20`;

  const loadFromTextarea = async () => {
    await loadDataFromText(rawPreview || exampleText, 'manual-input.csv');
  };

  return (
    <div className="space-y-6 text-sm">
      <div className="p-4 rounded-lg border border-cyan-400/20 bg-cyan-400/5 flex items-center justify-between">
        <div>
          <p className="font-semibold text-cyan-200 mb-1">Estado Pyodide: {pyodideReady ? '✅ Listo' : '⏳ Inicializando...'}</p>
          <p className="text-cyan-100/70 text-xs max-w-md">El motor Python se precarga en segundo plano para análisis rápidos de tus datasets.</p>
        </div>
        <button onClick={loadSample} className="px-4 py-2 bg-cyan-600/30 hover:bg-cyan-600/50 rounded-md text-cyan-100 text-xs font-semibold border border-cyan-400/30">Cargar dataset por defecto</button>
      </div>

      <form onSubmit={handleUrlLoad} className="space-y-2">
        <label className="text-cyan-200 font-medium text-xs uppercase tracking-wide">Cargar desde URL</label>
        <div className="flex gap-2">
          <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://.../archivo.csv" className="flex-1 px-3 py-2 rounded bg-cyan-900/40 border border-cyan-400/30 text-cyan-100 placeholder-cyan-300/40 text-xs" />
          <button disabled={loading} className="px-4 py-2 rounded bg-cyan-600/40 hover:bg-cyan-600/60 border border-cyan-400/30 text-cyan-100 text-xs font-semibold disabled:opacity-50">{loading ? 'Cargando...' : 'Cargar'}</button>
        </div>
      </form>

      <div className="space-y-2">
        <label className="text-cyan-200 font-medium text-xs uppercase tracking-wide">Subir Archivo CSV</label>
        <div
          onDragOver={e=>{e.preventDefault(); setDragActive(true);}}
          onDragLeave={()=>setDragActive(false)}
          onDrop={onDrop}
          onClick={()=>inputRef.current?.click()}
          className={`p-6 border-2 border-dashed rounded-lg cursor-pointer transition text-center text-cyan-200/80 ${dragActive? 'border-cyan-400 bg-cyan-400/10' : 'border-cyan-400/30 bg-cyan-400/5 hover:border-cyan-400/60'}`}
        >
          <p className="text-xs">{dragActive ? 'Suelta el archivo aquí' : 'Arrastra tu archivo CSV o haz click para seleccionar'}</p>
          <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onFileChange} />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-cyan-200 font-medium text-xs uppercase tracking-wide">Pegar texto CSV</label>
        <textarea
          className="w-full h-32 rounded bg-cyan-900/40 border border-cyan-400/30 text-cyan-100 text-xs p-2 font-mono"
          value={rawPreview}
          onChange={e=>setRawPreview(e.target.value)}
          placeholder={exampleText}
        />
        <div className="flex gap-2">
          <button onClick={loadFromTextarea} disabled={loading} className="px-3 py-1.5 rounded bg-cyan-600/40 hover:bg-cyan-600/60 border border-cyan-400/30 text-cyan-100 text-[11px] font-semibold disabled:opacity-50">Procesar Texto</button>
          <button type="button" onClick={()=>setRawPreview(exampleText)} className="px-3 py-1.5 rounded bg-cyan-400/20 hover:bg-cyan-400/30 text-cyan-100 text-[11px]">Ejemplo</button>
          <button type="button" onClick={()=>setRawPreview('')} className="px-3 py-1.5 rounded bg-cyan-400/20 hover:bg-cyan-400/30 text-cyan-100 text-[11px]">Limpiar</button>
        </div>
      </div>

      {error && <div className="text-amber-300 text-xs font-medium border border-amber-400/40 bg-amber-400/10 rounded p-3">{error}</div>}

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px] font-medium">
          <div className="p-3 rounded bg-cyan-400/10 border border-cyan-400/30">Filas<br/><span className="text-lg font-bold">{stats.shape[0].toLocaleString()}</span></div>
          <div className="p-3 rounded bg-cyan-400/10 border border-cyan-400/30">Columnas<br/><span className="text-lg font-bold">{stats.shape[1]}</span></div>
          <div className="p-3 rounded bg-cyan-400/10 border border-cyan-400/30">Nulos<br/><span className="text-lg font-bold">{stats.totalNulls.toLocaleString()}</span></div>
          <div className="p-3 rounded bg-cyan-400/10 border border-cyan-400/30">Completitud<br/><span className="text-lg font-bold">{((1 - stats.totalNulls / (stats.shape[0]*stats.shape[1]))*100).toFixed(1)}%</span></div>
        </div>
      )}

      {!loading && !data.length && (
        <p className="text-cyan-100/60 text-xs italic">No hay datos cargados todavía.</p>
      )}
    </div>
  );
};

export default DataLoader;
