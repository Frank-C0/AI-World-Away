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
  cleanData: (rows: any[], config: any) => Promise<any[]>;
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

def clean_data(rows, config):
    """
    Aplica estrategias de limpieza de datos según la configuración
    """
    try:
        console.log("Starting data cleaning...")
        console.log(f"Rows count: {len(rows) if rows else 0}")
        console.log(f"Config type: {type(config)}")
        
        if not rows:
            console.log("No rows provided, returning empty")
            return rows
        
        df = pd.DataFrame(rows)
        console.log(f"DataFrame shape: {df.shape}")
        
        # Convertir config de JS object a dict de Python si es necesario
        if hasattr(config, 'to_py'):
            config_dict = config.to_py()
        else:
            config_dict = dict(config) if config else {}
        
        console.log(f"Config keys: {list(config_dict.keys())}")
        
        # Eliminar duplicados si está habilitado
        remove_duplicates = config_dict.get('removeDuplicates', False)
        console.log(f"Remove duplicates: {remove_duplicates}")
        if remove_duplicates:
            initial_rows = len(df)
            df = df.drop_duplicates()
            console.log(f"Duplicates removed: {initial_rows - len(df)} rows")
        
        # Filtrar por columnas seleccionadas si están especificadas
        selected_columns = config_dict.get('selectedColumns', [])
        console.log(f"Selected columns: {selected_columns}")
        if selected_columns:
            # Asegurar que target column esté incluida si existe
            target_col = config_dict.get('targetColumn')
            if target_col and target_col not in selected_columns:
                selected_columns = selected_columns + [target_col]
                console.log(f"Added target column: {target_col}")
            
            # Filtrar solo columnas que existen en el DataFrame
            available_columns = [col for col in selected_columns if col in df.columns]
            console.log(f"Available columns: {available_columns}")
            if available_columns:
                df = df[available_columns]
                console.log(f"DataFrame filtered to shape: {df.shape}")
        
        # Aplicar filtros categóricos
        categorical_filters = config_dict.get('categoricalFilters', {})
        console.log(f"Categorical filters: {list(categorical_filters.keys())}")
        for col, values in categorical_filters.items():
            if col in df.columns and values:
                initial_rows = len(df)
                df = df[df[col].isin(values)]
                console.log(f"Filtered {col}: {initial_rows - len(df)} rows removed")
        
        # Obtener tipos de columna personalizados
        column_types = config_dict.get('columnTypes', {})
        console.log(f"Column types: {column_types}")
        
        # Aplicar estrategias por columna
        column_strategies = config_dict.get('columnStrategies', {})
        console.log(f"Column strategies: {list(column_strategies.keys())}")
        
        for col, strategy in column_strategies.items():
            if col not in df.columns:
                console.log(f"Column {col} not in DataFrame, skipping")
                continue
                
            console.log(f"Processing column {col} with strategy: {strategy}")
            
            # Obtener tipo efectivo de la columna
            effective_type = column_types.get(col, 'numeric' if pd.api.types.is_numeric_dtype(df[col]) else 'categorical')
            console.log(f"Column {col} effective type: {effective_type}")
            
            # Aplicar filtros categóricos (antes de otras operaciones)
            if effective_type == 'categorical':
                selected_categories = strategy.get('selectedCategories', [])
                if selected_categories:
                    initial_rows = len(df)
                    df = df[df[col].isin(selected_categories)]
                    console.log(f"Filtered {col} to selected categories: {initial_rows - len(df)} rows removed")
                
                # Agrupar categorías raras
                if strategy.get('groupRareCategories', False):
                    try:
                        rare_threshold = strategy.get('rareThreshold', 5) / 100.0  # convertir a decimal
                        value_counts = df[col].value_counts()
                        total_count = len(df)
                        rare_values = value_counts[value_counts / total_count < rare_threshold].index.tolist()
                        
                        if rare_values:
                            df[col] = df[col].replace(rare_values, 'Otros')
                            console.log(f"Grouped {len(rare_values)} rare categories in {col} as 'Otros'")
                    except Exception as e:
                        console.log(f"Error grouping rare categories in {col}: {str(e)}")
            
            # Remover nulls
            if strategy.get('removeNulls', False):
                initial_rows = len(df)
                df = df.dropna(subset=[col])
                console.log(f"Removed nulls from {col}: {initial_rows - len(df)} rows")
                continue
                
            # Remover outliers por cuartiles (solo para columnas tratadas como numéricas)
            if strategy.get('removeOutliers', False) and effective_type == 'numeric':
                try:
                    if pd.api.types.is_numeric_dtype(df[col]):
                        initial_rows = len(df)
                        Q1 = df[col].quantile(0.25)
                        Q3 = df[col].quantile(0.75)
                        IQR = Q3 - Q1
                        lower = Q1 - 1.5 * IQR
                        upper = Q3 + 1.5 * IQR
                        df = df[(df[col] >= lower) & (df[col] <= upper)]
                        console.log(f"Removed outliers from {col}: {initial_rows - len(df)} rows")
                except Exception as e:
                    console.log(f"Error removing outliers from {col}: {str(e)}")
                continue
                
            # Estrategias de relleno
            fill_strategy = strategy.get('fillStrategy')
            if fill_strategy and fill_strategy != 'drop':
                console.log(f"Applying fill strategy {fill_strategy} to {col}")
                
                if fill_strategy == 'mean' and effective_type == 'numeric':
                    try:
                        if pd.api.types.is_numeric_dtype(df[col]):
                            mean_val = df[col].mean()
                            nulls_filled = df[col].isna().sum()
                            df[col] = df[col].fillna(mean_val)
                            console.log(f"Filled {nulls_filled} nulls in {col} with mean: {mean_val}")
                    except Exception as e:
                        console.log(f"Error filling {col} with mean: {str(e)}")
                elif fill_strategy == 'median' and effective_type == 'numeric':
                    try:
                        if pd.api.types.is_numeric_dtype(df[col]):
                            median_val = df[col].median()
                            nulls_filled = df[col].isna().sum()
                            df[col] = df[col].fillna(median_val)
                            console.log(f"Filled {nulls_filled} nulls in {col} with median: {median_val}")
                    except Exception as e:
                        console.log(f"Error filling {col} with median: {str(e)}")
                elif fill_strategy == 'mode':
                    try:
                        mode_val = df[col].mode()
                        if len(mode_val) > 0:
                            nulls_filled = df[col].isna().sum()
                            df[col] = df[col].fillna(mode_val[0])
                            console.log(f"Filled {nulls_filled} nulls in {col} with mode: {mode_val[0]}")
                    except Exception as e:
                        console.log(f"Error filling {col} with mode: {str(e)}")
                elif fill_strategy == 'forward':
                    try:
                        nulls_before = df[col].isna().sum()
                        df[col] = df[col].ffill()
                        nulls_after = df[col].isna().sum()
                        console.log(f"Forward filled {nulls_before - nulls_after} nulls in {col}")
                    except Exception as e:
                        console.log(f"Error forward filling {col}: {str(e)}")
                elif fill_strategy == 'backward':
                    try:
                        nulls_before = df[col].isna().sum()
                        df[col] = df[col].bfill()
                        nulls_after = df[col].isna().sum()
                        console.log(f"Backward filled {nulls_before - nulls_after} nulls in {col}")
                    except Exception as e:
                        console.log(f"Error backward filling {col}: {str(e)}")
            elif fill_strategy == 'drop':
                try:
                    initial_rows = len(df)
                    df = df.dropna(subset=[col])
                    console.log(f"Dropped rows with nulls in {col}: {initial_rows - len(df)} rows")
                except Exception as e:
                    console.log(f"Error dropping nulls from {col}: {str(e)}")
        
        result = df.to_dict(orient='records')
        console.log(f"Cleaning completed. Final shape: {df.shape}")
        return result
        
    except Exception as e:
        console.log(f"Error in clean_data: {str(e)}")
        console.log(f"Error type: {type(e)}")
        import traceback
        console.log(f"Traceback: {traceback.format_exc()}")
        raise e
`;

export function initPyodide(): PyodideContext & { _pyodide?: any } {
  if (!_ready) {
    _ready = (async () => {
      // @ts-ignore global loadPyodide cargado en index.html
      _pyodide = await (window as any).loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.28.3/full/'
      });
      await _pyodide.loadPackage(['pandas', 'matplotlib', 'micropip', 'scipy']);
      const micropip = _pyodide.pyimport("micropip");
      await micropip.install('seaborn');
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

  const cleanData = async (rows: any[], config: any): Promise<any[]> => {
    await _ready;
    if (!_pyodide) throw new Error('Pyodide no inicializado');
    
    console.log('📤 Sending data to Python for cleaning...');
    console.log('Rows count:', rows.length);
    console.log('Config object:', config);
    
    // Convertir explícitamente a objetos Python
    _pyodide.globals.set('___cleaning_rows', rows);
    
    // Asegurar que la configuración se convierte correctamente
    const configToSend = {
      removeDuplicates: config.removeDuplicates || false,
      selectedColumns: config.selectedColumns || [],
      targetColumn: config.targetColumn || null,
      categoricalFilters: config.categoricalFilters || {},
      columnStrategies: config.columnStrategies || {},
      columnTypes: config.columnTypes || {},
      isEnabled: config.isEnabled || false
    };
    
    console.log('📤 Processed config:', configToSend);
    _pyodide.globals.set('___cleaning_config', configToSend);
    
    try {
      const result = await _pyodide.runPythonAsync(`clean_data(___cleaning_rows, ___cleaning_config)`);
      const jsResult = result.toJs ? result.toJs({}) : result;
      console.log('📥 Received cleaned data:', jsResult.length, 'rows');
      return jsResult;
    } catch (error) {
      console.error('❌ Python error during cleaning:', error);
      throw new Error(`Error limpiando datos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  return { ready: _ready, runPython, loadCSV, analyzeData, parseCSVText, writeCSVAndParse, generateCorrelationPlot, cleanData, _pyodide } as any;
}

export const pyodideContext = initPyodide();
