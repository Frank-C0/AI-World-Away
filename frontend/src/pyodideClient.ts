// Cliente de inicialización y utilidades para Pyodide
// Permite ejecutar código Python y convertir resultados a objetos JS

export interface PyodideContext {
  ready: Promise<void>;
  runPython: (code: string) => any;
  loadCSV: (url: string) => Promise<any[]>;
  analyzeData: (rows: any[]) => any;
  parseCSVText: (text: string) => Promise<any[]>;
  writeCSVAndParse: (fileName: string, text: string) => Promise<any[]>;
  generateCorrelationPlot: (rows: any[], method?: string, sizeMultiplier?: number) => Promise<string>;
  calculateTargetCorrelations: (rows: any[], targetColumn: string, method?: string) => Promise<any[]>;
  cleanData: (rows: any[], config: any) => Promise<any[]>;
  trainXGBoost: (rows: any[], config: any) => Promise<any>;
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

def calculate_target_correlations(rows, target_column, method='pearson'):
    """
    Calcula las correlaciones de todas las columnas numéricas con la variable objetivo
    """
    if not rows or not target_column:
        return []
    
    df = pd.DataFrame(rows)
    
    if target_column not in df.columns:
        return []
    
    # Filtrar solo columnas numéricas
    numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
    
    if target_column not in numeric_cols:
        return []
    
    correlations = []
    target_series = df[target_column]
    
    for col in numeric_cols:
        if col != target_column:
            try:
                corr_value = target_series.corr(df[col], method=method)
                if not pd.isna(corr_value):
                    correlations.append({
                        'column': col,
                        'correlation': float(corr_value),
                        'abs_correlation': abs(float(corr_value))
                    })
            except:
                continue
    
    # Ordenar por correlación absoluta descendente
    correlations.sort(key=lambda x: x['abs_correlation'], reverse=True)
    return correlations

def generate_correlation_plot(rows, method='pearson', figsize_multiplier=1.0):
    """
    Genera un gráfico de correlación usando seaborn y lo devuelve como una imagen base64
    methods: 'pearson', 'kendall', 'spearman'
    figsize_multiplier: factor para ajustar el tamaño de la imagen
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
    
    # Tamaño automático más inteligente
    n_cols = len(numeric_cols)
    
    # Tamaño base escalado inteligentemente
    if n_cols <= 5:
        base_size = 8
    elif n_cols <= 10:
        base_size = 10
    elif n_cols <= 15:
        base_size = 12
    else:
        base_size = 14
    
    # Aplicar multiplicador pero con límites sensatos
    final_size = base_size * figsize_multiplier
    final_size = max(6, min(20, final_size))  # Entre 6 y 20 pulgadas
    
    figsize = (final_size, final_size)
    
    # Crear figura
    plt.figure(figsize=figsize)
    
    # Tamaño de fuente automático basado en número de columnas
    if n_cols <= 8:
        annot_size = 10
        title_size = 14
    elif n_cols <= 12:
        annot_size = 8
        title_size = 12
    elif n_cols <= 20:
        annot_size = 7
        title_size = 11
    else:
        annot_size = 6
        title_size = 10
    
    # Generar gráfico de correlación con seaborn
    sns.heatmap(
        corr_df, 
        annot=True, 
        cmap='coolwarm', 
        vmin=-1, 
        vmax=1, 
        center=0,
        square=True, 
        linewidths=0.5, 
        cbar_kws={"shrink": 0.8},
        fmt=".2f",
        annot_kws={'size': annot_size}
    )
    
    plt.title(f'Matriz de Correlación ({method.capitalize()})', fontsize=title_size, pad=20)
    plt.tight_layout()
    
    # DPI automático para balancear calidad y tamaño de archivo
    if n_cols <= 10:
        dpi = 120
    elif n_cols <= 15:
        dpi = 110
    else:
        dpi = 100
    
    # Convertir a base64 para retornar al cliente
    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=int(dpi), bbox_inches='tight', facecolor='white')
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

def train_xgboost_model(rows, config):
    """
    Entrena un modelo XGBoost con la configuración especificada
    """
    try:
        console.log("🤖 Starting XGBoost training...")
        
        if not rows:
            raise ValueError("No data provided for training")
        
        # Crear DataFrame
        df = pd.DataFrame(rows)
        console.log(f"Dataset shape: {df.shape}")
        
        # Convertir configuración
        if hasattr(config, 'to_py'):
            config_dict = config.to_py()
        else:
            config_dict = dict(config)
        
        target_column = config_dict.get('targetColumn')
        feature_columns = config_dict.get('featureColumns', [])
        
        if not target_column or not feature_columns:
            raise ValueError("Target column and feature columns must be specified")
        
        console.log(f"Target: {target_column}")
        console.log(f"Features: {feature_columns}")
        
        # Preparar datos
        X = df[feature_columns].copy()
        y = df[target_column].copy()
        
        # Manejar encoding automático de categóricas
        categorical_encoding = config_dict.get('categoricalEncoding', 'auto')
        console.log(f"Categorical encoding: {categorical_encoding}")
        
        # Detectar columnas categóricas
        categorical_cols = []
        for col in feature_columns:
            if col in X.columns:
                if X[col].dtype == 'object' or X[col].dtype.name == 'category':
                    categorical_cols.append(col)
        
        console.log(f"Categorical columns detected: {categorical_cols}")
        
        # Aplicar encoding si hay categóricas
        if categorical_cols and categorical_encoding != 'auto':
            if categorical_encoding == 'onehot':
                # One-hot encoding
                for col in categorical_cols:
                    dummies = pd.get_dummies(X[col], prefix=col, drop_first=True)
                    X = pd.concat([X.drop(col, axis=1), dummies], axis=1)
                console.log(f"Applied one-hot encoding to {len(categorical_cols)} columns")
            elif categorical_encoding == 'label':
                # Label encoding
                from sklearn.preprocessing import LabelEncoder
                for col in categorical_cols:
                    le = LabelEncoder()
                    X[col] = le.fit_transform(X[col].astype(str))
                console.log(f"Applied label encoding to {len(categorical_cols)} columns")
            elif categorical_encoding == 'target':
                # Target encoding (simplified)
                for col in categorical_cols:
                    target_mean = y.groupby(X[col]).mean()
                    X[col] = X[col].map(target_mean)
                console.log(f"Applied target encoding to {len(categorical_cols)} columns")
        
        # Si encoding es 'auto', las columnas categóricas se pasarán tal como están a XGBoost
        
        # Manejar valores nulos
        X = X.fillna(-999)  # XGBoost puede manejar valores nulos pero es mejor ser explícito
        
        # División de datos
        from sklearn.model_selection import train_test_split
        test_size = config_dict.get('testSize', 0.2)
        val_size = config_dict.get('valSize', 0.2)
        use_val_as_test = config_dict.get('useValAsTest', False)
        random_state = config_dict.get('randomState', 42)
        
        if use_val_as_test:
            # Solo train/test split
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=test_size, random_state=random_state, stratify=y if len(y.unique()) > 1 else None
            )
            X_val, y_val = None, None
        else:
            # Train/val/test split
            X_temp, X_test, y_temp, y_test = train_test_split(
                X, y, test_size=test_size, random_state=random_state, stratify=y if len(y.unique()) > 1 else None
            )
            val_size_adjusted = val_size / (1 - test_size)
            X_train, X_val, y_train, y_val = train_test_split(
                X_temp, y_temp, test_size=val_size_adjusted, random_state=random_state, 
                stratify=y_temp if len(y_temp.unique()) > 1 else None
            )
        
        console.log(f"Train set: {X_train.shape}")
        if X_val is not None:
            console.log(f"Validation set: {X_val.shape}")
        console.log(f"Test set: {X_test.shape}")
        
        # Aplicar balanceo si está habilitado
        apply_balancing = config_dict.get('applyBalancing', False)
        if apply_balancing:
            console.log("Applying data balancing...")
            balancing_method = config_dict.get('balancingMethod', 'smote')
            
            if balancing_method == 'smote':
                try:
                    from imblearn.over_sampling import SMOTE
                    smote = SMOTE(random_state=random_state)
                    X_train, y_train = smote.fit_resample(X_train, y_train)
                    console.log(f"SMOTE applied. New train shape: {X_train.shape}")
                except ImportError:
                    console.log("SMOTE not available, using random oversampling")
                    from sklearn.utils import resample
                    # Oversample minority class
                    min_class = y_train.value_counts().idxmin()
                    max_count = y_train.value_counts().max()
                    train_df = pd.concat([X_train, y_train], axis=1)
                    majority = train_df[train_df[target_column] != min_class]
                    minority = train_df[train_df[target_column] == min_class]
                    minority_upsampled = resample(minority, replace=True, n_samples=max_count, random_state=random_state)
                    train_balanced = pd.concat([majority, minority_upsampled])
                    X_train = train_balanced.drop(target_column, axis=1)
                    y_train = train_balanced[target_column]
            elif balancing_method == 'oversampling':
                from sklearn.utils import resample
                train_df = pd.concat([X_train, y_train], axis=1)
                min_class = y_train.value_counts().idxmin()
                max_count = y_train.value_counts().max()
                majority = train_df[train_df[target_column] != min_class]
                minority = train_df[train_df[target_column] == min_class]
                minority_upsampled = resample(minority, replace=True, n_samples=max_count, random_state=random_state)
                train_balanced = pd.concat([majority, minority_upsampled])
                X_train = train_balanced.drop(target_column, axis=1)
                y_train = train_balanced[target_column]
            elif balancing_method == 'undersampling':
                from sklearn.utils import resample
                train_df = pd.concat([X_train, y_train], axis=1)
                min_count = y_train.value_counts().min()
                balanced_dfs = []
                for class_val in y_train.unique():
                    class_df = train_df[train_df[target_column] == class_val]
                    class_downsampled = resample(class_df, replace=False, n_samples=min_count, random_state=random_state)
                    balanced_dfs.append(class_downsampled)
                train_balanced = pd.concat(balanced_dfs)
                X_train = train_balanced.drop(target_column, axis=1)
                y_train = train_balanced[target_column]
        
        # Configurar XGBoost
        import xgboost as xgb
        
        # Determinar tipo de problema
        is_classification = len(y.unique()) <= 20  # Heurística simple
        
        # Configurar early stopping
        early_stopping_rounds = config_dict.get('earlyStoppingRounds', 10)
        

        # Parámetros XGBoost
        xgb_params = {
            'max_depth': config_dict.get('maxDepth', 6),
            'n_estimators': config_dict.get('nEstimators', 100),
            'learning_rate': config_dict.get('learningRate', 0.1),
            'subsample': config_dict.get('subsample', 1.0),
            'colsample_bytree': config_dict.get('colsampleBytree', 1.0),
            'reg_alpha': config_dict.get('regAlpha', 0),
            'reg_lambda': config_dict.get('regLambda', 1),
            'random_state': random_state,
            'n_jobs': -1,
            'early_stopping_rounds': early_stopping_rounds if X_val is not None else None,
        }
        
        if is_classification:
            if len(y.unique()) == 2:
                xgb_params['objective'] = 'binary:logistic'
                xgb_params['eval_metric'] = 'logloss'
                model = xgb.XGBClassifier(**xgb_params)
            else:
                xgb_params['objective'] = 'multi:softprob'
                xgb_params['eval_metric'] = 'mlogloss'
                model = xgb.XGBClassifier(**xgb_params)
                
            # Balance de clases
            scale_pos_weight = config_dict.get('scalePositiveWeight', 1)
            if scale_pos_weight != 1 and len(y.unique()) == 2:
                xgb_params['scale_pos_weight'] = scale_pos_weight
        else:
            xgb_params['objective'] = 'reg:squarederror'
            xgb_params['eval_metric'] = 'rmse'
            model = xgb.XGBRegressor(**xgb_params)
        
        console.log(f"Training {'classification' if is_classification else 'regression'} model")
        console.log(f"XGBoost parameters: {xgb_params}")
        
        eval_set = [(X_train, y_train)]
        if X_val is not None:
            eval_set.append((X_val, y_val))
        
        # Entrenar modelo
        model.fit(
            X_train, y_train,
            eval_set=eval_set,
            verbose=False
        )
        
        console.log("✅ Model training completed")
        
        # Hacer predicciones
        y_train_pred = model.predict(X_train)
        y_test_pred = model.predict(X_test)
        if X_val is not None:
            y_val_pred = model.predict(X_val)
        
        # Calcular métricas
        if is_classification:
            from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix
            
            # Métricas de test
            accuracy = float(accuracy_score(y_test, y_test_pred))
            precision, recall, f1, _ = precision_recall_fscore_support(y_test, y_test_pred, average='weighted')
            cm = confusion_matrix(y_test, y_test_pred)
            
            # Métricas de entrenamiento
            train_accuracy = float(accuracy_score(y_train, y_train_pred))
            val_accuracy = None
            if X_val is not None:
                val_accuracy = float(accuracy_score(y_val, y_val_pred))
            
            # Feature importance
            feature_importance = []
            for i, feature in enumerate(X_train.columns):
                importance = float(model.feature_importances_[i])
                feature_importance.append({'feature': feature, 'importance': importance})
            
            # Ordenar por importancia
            feature_importance.sort(key=lambda x: x['importance'], reverse=True)
            
            results = {
                'accuracy': accuracy,
                'precision': float(precision),
                'recall': float(recall),
                'f1Score': float(f1),
                'confusionMatrix': cm.tolist(),
                'classNames': [str(c) for c in model.classes_],
                'featureImportance': feature_importance,
                'trainAccuracy': train_accuracy,
                'valAccuracy': val_accuracy,
                'modelType': 'classification'
            }
        else:
            from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
            
            # Métricas de test
            mse = mean_squared_error(y_test, y_test_pred)
            mae = mean_absolute_error(y_test, y_test_pred)
            r2 = r2_score(y_test, y_test_pred)
            
            # Métricas de entrenamiento
            train_mse = mean_squared_error(y_train, y_train_pred)
            train_r2 = r2_score(y_train, y_train_pred)
            val_r2 = None
            if X_val is not None:
                val_r2 = r2_score(y_val, y_val_pred)
            
            # Feature importance
            feature_importance = []
            for i, feature in enumerate(X_train.columns):
                importance = float(model.feature_importances_[i])
                feature_importance.append({'feature': feature, 'importance': importance})
            
            feature_importance.sort(key=lambda x: x['importance'], reverse=True)
            
            results = {
                'mse': float(mse),
                'mae': float(mae),
                'r2Score': float(r2),
                'rmse': float(mse ** 0.5),
                'featureImportance': feature_importance,
                'trainR2': float(train_r2),
                'valR2': val_r2,
                'modelType': 'regression'
            }
        
        console.log("📊 Metrics calculated successfully")
        return results
        
    except Exception as e:
        console.log(f"❌ Error in XGBoost training: {str(e)}")
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
      await micropip.install(['seaborn', 'xgboost', 'scikit-learn', 'imbalanced-learn']);
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
  
  const generateCorrelationPlot = async (rows: any[], method: string = 'pearson', sizeMultiplier: number = 1.0): Promise<string> => {
    await _ready;
    if (!_pyodide) throw new Error('Pyodide no inicializado');
    _pyodide.globals.set('___correlation_rows', rows);
    _pyodide.globals.set('___correlation_method', method);
    _pyodide.globals.set('___size_multiplier', sizeMultiplier);
    try {
      const result = await _pyodide.runPythonAsync(`generate_correlation_plot(___correlation_rows, ___correlation_method, ___size_multiplier)`);
      return result;
    } catch (error) {
      console.error('Error generando gráfico de correlación:', error);
      throw new Error(`Error generando gráfico de correlación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const calculateTargetCorrelations = async (rows: any[], targetColumn: string, method: string = 'pearson'): Promise<any[]> => {
    await _ready;
    if (!_pyodide) throw new Error('Pyodide no inicializado');
    _pyodide.globals.set('___target_rows', rows);
    _pyodide.globals.set('___target_column', targetColumn);
    _pyodide.globals.set('___target_method', method);
    try {
      const result = await _pyodide.runPythonAsync(`calculate_target_correlations(___target_rows, ___target_column, ___target_method)`);
      return result.toJs ? result.toJs({}) : result;
    } catch (error) {
      console.error('Error calculating target correlations:', error);
      return [];
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

  const trainXGBoost = async (rows: any[], config: any): Promise<any> => {
    await _ready;
    if (!_pyodide) throw new Error('Pyodide no inicializado');
    
    console.log('🤖 Sending data to Python for XGBoost training...');
    console.log('Rows count:', rows.length);
    console.log('ML Config:', config);
    
    _pyodide.globals.set('___ml_rows', rows);
    _pyodide.globals.set('___ml_config', config);
    
    try {
      const result = await _pyodide.runPythonAsync(`train_xgboost_model(___ml_rows, ___ml_config)`);
      const jsResult = result.toJs ? result.toJs({}) : result;
      console.log('📥 Received ML results:', jsResult);
      return jsResult;
    } catch (error) {
      console.error('❌ Python error during XGBoost training:', error);
      throw new Error(`Error entrenando modelo XGBoost: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  return { ready: _ready, runPython, loadCSV, analyzeData, parseCSVText, writeCSVAndParse, generateCorrelationPlot, calculateTargetCorrelations, cleanData, trainXGBoost, _pyodide } as any;
}

export const pyodideContext = initPyodide();
