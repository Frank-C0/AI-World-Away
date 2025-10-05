// Cliente de inicialización y utilidades para Pyodide
// Permite ejecutar código Python y convertir resultados a objetos JS

export interface PyodideContext {
  ready: Promise<void>;
  runPython: (code: string) => any;
  loadCSV: (url: string) => Promise<any[]>;
  analyzeData: (rows: any[]) => any;
  parseCSVText: (text: string) => Promise<any[]>;
  writeCSVAndParse: (fileName: string, text: string) => Promise<any[]>;
}

let _pyodide: any; // instancia pyodide
let _ready: Promise<void> | null = null;

// Código Python reducido: sólo pandas (requiere que pandas se haya cargado correctamente)
const PY_HELPERS = `
import io, math, pandas as pd

def parse_csv(text: str):
    df = pd.read_csv(io.StringIO(text), comment='#')
    return df.to_dict(orient='records')

def parse_csv_file(path: str):
    df = pd.read_csv(path, comment='#')
    return df.to_dict(orient='records')

def analyze(rows):
    if not rows:
        return {'shape': [0,0], 'columns': [], 'totalNulls': 0}
    df = pd.DataFrame(rows)
    col_meta = []
    total_nulls = int(df.isna().sum().sum())
    for c in df.columns:
        s = df[c]
        is_numeric = pd.api.types.is_numeric_dtype(s)
        non_null = s.dropna()
        unique_vals = sorted([str(v) for v in non_null.unique().tolist()])
        is_categorical = (not is_numeric) and len(unique_vals) <= 20
        mn = float(non_null.min()) if is_numeric and not non_null.empty else None
        mx = float(non_null.max()) if is_numeric and not non_null.empty else None
        col_meta.append({
            'name': c,
            'dtype': str(s.dtype),
            'isNumeric': bool(is_numeric),
            'isCategorical': bool(is_categorical),
            'uniqueValues': unique_vals,
            'min': mn,
            'max': mx,
            'nullCount': int(s.isna().sum()),
        })
    return {'shape': [len(df), len(df.columns)], 'columns': col_meta, 'totalNulls': total_nulls}
`;

export function initPyodide(): PyodideContext & { _pyodide?: any } {
  if (!_ready) {
    _ready = (async () => {
      // @ts-ignore global loadPyodide cargado en index.html
      _pyodide = await (window as any).loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/'
      });
      await _pyodide.loadPackage(['pandas']);
      await _pyodide.runPythonAsync(PY_HELPERS);
    })();
  }

  const runPython = (code: string) => {
    if (!_pyodide) throw new Error('Pyodide no inicializado todavía');
    return _pyodide.runPython(code);
  };

  const loadCSV = async (url: string): Promise<any[]> => {
    await _ready; // asegurar inicialización
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('No se pudo cargar CSV: '+resp.status);
    const text = await resp.text();
    // Pasar el texto a Python
    _pyodide.globals.set('___csv_text', text);
    const rows = await _pyodide.runPythonAsync(`parse_csv(___csv_text)`);
    return rows.toJs ? rows.toJs({}) : rows; // convertir a objeto JS
  };

  const parseCSVText = async (text: string): Promise<any[]> => {
    await _ready;
    if (!_pyodide) throw new Error('Pyodide no inicializado');
    _pyodide.globals.set('___csv_text_direct', text);
    const rows = await _pyodide.runPythonAsync('parse_csv(___csv_text_direct)');
    return rows.toJs ? rows.toJs({}) : rows;
  };

  const writeCSVAndParse = async (fileName: string, text: string): Promise<any[]> => {
    await _ready;
    if (!_pyodide) throw new Error('Pyodide no inicializado');
    // Escribir el archivo completo en el FS virtual de Pyodide y parsear vía pandas / fallback
    _pyodide.FS.writeFile(fileName, text);
    const rows = await _pyodide.runPythonAsync(`parse_csv_file('${fileName.replace(/'/g, "")}')`);
    return rows.toJs ? rows.toJs({}) : rows;
  };

  const analyzeData = (rows: any[]) => {
    // Convertir a estructura Python (lista de dict) automáticamente permitida
    _pyodide.globals.set('___rows', rows);
    const result = _pyodide.runPython(`analyze(___rows)`);
    return result.toJs ? result.toJs({}) : result;
  };

  return { ready: _ready, runPython, loadCSV, analyzeData, parseCSVText, writeCSVAndParse, _pyodide } as any;
}

export const pyodideContext = initPyodide();
