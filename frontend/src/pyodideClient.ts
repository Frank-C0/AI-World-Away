// Cliente de inicialización y utilidades para Pyodide
// Permite ejecutar código Python y convertir resultados a objetos JS

export interface PyodideContext {
  ready: Promise<void>;
  runPython: (code: string) => any;
  loadCSV: (url: string) => Promise<any[]>; // Retorna filas como objetos
  analyzeData: (rows: any[]) => any; // Retorna estadísticas similares a Danfo
}

let _pyodide: any; // instancia pyodide
let _ready: Promise<void> | null = null;

// Código Python que define utilidades: lectura CSV (usando pyodide.http + pandas like con polars si se instala) usando stdlib
// Usaremos Python puro para parsear CSV (csv.DictReader) para evitar dependencias pesadas.
const PY_HELPERS = `
import io, csv, math
from statistics import mean

def parse_csv(text: str):
    f = io.StringIO(text)
    reader = csv.DictReader(f)
    rows = [dict(r) for r in reader]
    # Intentar convertir a tipos numéricos
    for row in rows:
        for k,v in list(row.items()):
            if v is None:
                continue
            val = v.strip()
            if val == '':
                row[k] = None
                continue
            # boolean heurístico
            lv = val.lower()
            if lv in ('true','false'):
                row[k] = (lv=='true')
                continue
            # num
            try:
                if '.' in val:
                    row[k] = float(val)
                else:
                    row[k] = int(val)
            except Exception:
                row[k] = v
    return rows


def analyze(rows):
    if not rows:
        return {
            'shape': [0,0],
            'columns': [],
            'totalNulls': 0
        }
    # columnas
    cols = list(rows[0].keys())
    col_meta = []
    total_nulls = 0
    for c in cols:
        values = [r.get(c) for r in rows]
        non_null = [v for v in values if v is not None and not (isinstance(v,float) and math.isnan(v))]
        null_count = len(values) - len(non_null)
        total_nulls += null_count
        unique_vals = sorted({str(v) for v in non_null})
        # tipos
        is_numeric = all(isinstance(v,(int,float)) for v in non_null) and len(non_null)>0
        is_categorical = (not is_numeric) and len(unique_vals) <= 20
        mn = mx = None
        if is_numeric:
            nums = [float(v) for v in non_null if v is not None]
            if nums:
                mn = min(nums)
                mx = max(nums)
        col_meta.append({
            'name': c,
            'dtype': 'number' if is_numeric else 'object',
            'isNumeric': is_numeric,
            'isCategorical': is_categorical,
            'uniqueValues': unique_vals,
            'min': mn,
            'max': mx,
            'nullCount': null_count,
        })
    return {
        'shape': [len(rows), len(cols)],
        'columns': col_meta,
        'totalNulls': total_nulls,
    }
`;

export function initPyodide(): PyodideContext & { _pyodide?: any } {
  if (!_ready) {
    _ready = (async () => {
      // @ts-ignore global loadPyodide cargado en index.html
      _pyodide = await (window as any).loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/'
      });
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

  const analyzeData = (rows: any[]) => {
    // Convertir a estructura Python (lista de dict) automáticamente permitida
    _pyodide.globals.set('___rows', rows);
    const result = _pyodide.runPython(`analyze(___rows)`);
    return result.toJs ? result.toJs({}) : result;
  };

  return { ready: _ready, runPython, loadCSV, analyzeData, _pyodide } as any;
}

export const pyodideContext = initPyodide();
