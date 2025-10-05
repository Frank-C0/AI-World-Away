// Cliente de inicialización y utilidades para Pyodide
// Permite ejecutar código Python y convertir resultados a objetos JS

export interface PyodideContext {
  ready: Promise<void>;
  runPython: (code: string) => any;
  loadCSV: (url: string) => Promise<any[]>;
  analyzeData: (rows: any[]) => any;
  parseCSVText: (text: string) => Promise<any[]>;
  writeCSVAndParse: (fileName: string, text: string) => Promise<any[]>;
  generateCorrelationPlot: (rows: any[], method?: string) => Promise<string>;
}

let _pyodide: any; // instancia pyodide
let _ready: Promise<void> | null = null;

// Código Python reducido: sólo pandas (requiere que pandas se haya cargado correctamente)
const PY_HELPERS = `
import io, math, pandas as pd
import base64
from js import console

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

def generate_correlation_plot(rows, method='pearson'):
    """
    Genera un gráfico de correlación usando seaborn y lo devuelve como una imagen base64
    methods: 'pearson', 'kendall', 'spearman'
    """
    import matplotlib.pyplot as plt
    import seaborn as sns
    import io
    
    # Crear DataFrame y filtrar solo columnas numéricas
    df = pd.DataFrame(rows)
    numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
    
    if len(numeric_cols) < 2:
        return "error: Se requieren al menos 2 columnas numéricas para calcular correlaciones"
    
    # Calcular matriz de correlación
    corr_df = df[numeric_cols].corr(method=method)
    
    # Crear figura
    plt.figure(figsize=(10, 8))
    mask = None
    
    # Generar gráfico de correlación con seaborn
    sns.heatmap(
        corr_df, 
        annot=True, 
        mask=mask,
        cmap='coolwarm', 
        vmin=-1, 
        vmax=1, 
        center=0,
        square=True, 
        linewidths=.5, 
        cbar_kws={"shrink": .8},
        fmt=".2f"
    )
    plt.title(f'Matriz de Correlación ({method.capitalize()})')
    plt.tight_layout()
    
    # Convertir a base64 para retornar al cliente
    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=100)
    buf.seek(0)
    img_base64 = base64.b64encode(buf.read()).decode('utf-8')
    plt.close()
    
    return f"data:image/png;base64,{img_base64}"
`;

export function initPyodide(): PyodideContext & { _pyodide?: any } {
  if (!_ready) {
    _ready = (async () => {
      // @ts-ignore global loadPyodide cargado en index.html
      _pyodide = await (window as any).loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.28.3/full/'
      });
      await _pyodide.loadPackage(['pandas', 'matplotlib', 'seaborn']);
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
  
  const generateCorrelationPlot = async (rows: any[], method: string = 'pearson'): Promise<string> => {
    await _ready;
    if (!_pyodide) throw new Error('Pyodide no inicializado');
    _pyodide.globals.set('___correlation_rows', rows);
    _pyodide.globals.set('___correlation_method', method);
    try {
      const result = await _pyodide.runPythonAsync(`generate_correlation_plot(___correlation_rows, ___correlation_method)`);
      return result;
    } catch (error) {
      console.error('Error generando gráfico de correlación:', error);
      throw new Error(`Error generando gráfico de correlación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  return { ready: _ready, runPython, loadCSV, analyzeData, parseCSVText, writeCSVAndParse, generateCorrelationPlot, _pyodide } as any;
}

export const pyodideContext = initPyodide();
