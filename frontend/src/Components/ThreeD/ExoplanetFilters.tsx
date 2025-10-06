// src/components/ExoplanetFilters.tsx
import React, { useState } from 'react';

type Filters = {
  koiDisposition: string;
  koiScoreMin: number; koiScoreMax: number;
  koiPeriodMin: number; koiPeriodMax: number;
  koiPradMin: number; koiPradMax: number;
  koiTeqMin: number; koiTeqMax: number;
  koiInsolMin: number; koiInsolMax: number;
  koiSteffMin: number; koiSteffMax: number;
  koiSradMin: number; koiSradMax: number;
};

interface ExoplanetFiltersProps {
  onChange: (newFilters: Filters) => void;
  filtrosActuales: Filters;
  dataRanges: Filters;
}

const ExoplanetFilters: React.FC<ExoplanetFiltersProps> = ({
  onChange,
  filtrosActuales,
  dataRanges
}) => {
  // Estado temporal para los filtros (solo se aplican al presionar el botón)
  const [tempFilters, setTempFilters] = useState<Filters>(filtrosActuales);

  const handleChange = (field: keyof Filters, value: string | number) => {
    setTempFilters({ ...tempFilters, [field]: value });
  };

  const handleApply = () => {
    onChange(tempFilters);
  };

  const handleReset = () => {
    setTempFilters(dataRanges);
    onChange(dataRanges);
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #0ff', marginBottom: '20px', borderRadius: '8px' }}>
      <h3 style={{ color: '#0ff', marginTop: 0 }}>Filtros</h3>
      
      {/* Disposición */}
      <div style={{ marginBottom: '15px' }}>
        <label>
          <strong>Disposición: </strong>
          <select
            value={tempFilters.koiDisposition}
            onChange={(e) => handleChange('koiDisposition', e.target.value)}
            style={{ marginLeft: '10px', padding: '5px', backgroundColor: '#1a1a2e', color: 'white', border: '1px solid #0ff' }}
          >
            <option value="all">Todos</option>
            <option value="CONFIRMED">Confirmado</option>
            <option value="CANDIDATE">Candidato</option>
            <option value="FALSE POSITIVE">Falso Positivo</option>
          </select>
        </label>
      </div>

      {/* Score */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          <strong>Confianza (Score): </strong>
          <span style={{ color: '#0ff' }}>
            {tempFilters.koiScoreMin.toFixed(2)} - {tempFilters.koiScoreMax.toFixed(2)}
          </span>
        </label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="range"
            min={dataRanges.koiScoreMin}
            max={dataRanges.koiScoreMax}
            step="0.01"
            value={tempFilters.koiScoreMin}
            onChange={(e) => handleChange('koiScoreMin', parseFloat(e.target.value))}
            style={{ flex: 1 }}
          />
          <input
            type="range"
            min={dataRanges.koiScoreMin}
            max={dataRanges.koiScoreMax}
            step="0.01"
            value={tempFilters.koiScoreMax}
            onChange={(e) => handleChange('koiScoreMax', parseFloat(e.target.value))}
            style={{ flex: 1 }}
          />
        </div>
      </div>

      {/* Periodo orbital */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          <strong>Periodo Orbital (días): </strong>
          <span style={{ color: '#0ff' }}>
            {tempFilters.koiPeriodMin.toFixed(1)} - {tempFilters.koiPeriodMax.toFixed(1)}
          </span>
        </label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="range"
            min={dataRanges.koiPeriodMin}
            max={dataRanges.koiPeriodMax}
            step="1"
            value={tempFilters.koiPeriodMin}
            onChange={(e) => handleChange('koiPeriodMin', parseFloat(e.target.value))}
            style={{ flex: 1 }}
          />
          <input
            type="range"
            min={dataRanges.koiPeriodMin}
            max={dataRanges.koiPeriodMax}
            step="1"
            value={tempFilters.koiPeriodMax}
            onChange={(e) => handleChange('koiPeriodMax', parseFloat(e.target.value))}
            style={{ flex: 1 }}
          />
        </div>
      </div>

      {/* Radio planetario */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          <strong>Radio Planetario (R⊕): </strong>
          <span style={{ color: '#0ff' }}>
            {tempFilters.koiPradMin.toFixed(2)} - {tempFilters.koiPradMax.toFixed(2)}
          </span>
        </label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="range"
            min={dataRanges.koiPradMin}
            max={dataRanges.koiPradMax}
            step="0.1"
            value={tempFilters.koiPradMin}
            onChange={(e) => handleChange('koiPradMin', parseFloat(e.target.value))}
            style={{ flex: 1 }}
          />
          <input
            type="range"
            min={dataRanges.koiPradMin}
            max={dataRanges.koiPradMax}
            step="0.1"
            value={tempFilters.koiPradMax}
            onChange={(e) => handleChange('koiPradMax', parseFloat(e.target.value))}
            style={{ flex: 1 }}
          />
        </div>
      </div>

      {/* Temperatura de equilibrio */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          <strong>Temperatura (K): </strong>
          <span style={{ color: '#0ff' }}>
            {tempFilters.koiTeqMin.toFixed(0)} - {tempFilters.koiTeqMax.toFixed(0)}
          </span>
        </label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="range"
            min={dataRanges.koiTeqMin}
            max={dataRanges.koiTeqMax}
            step="10"
            value={tempFilters.koiTeqMin}
            onChange={(e) => handleChange('koiTeqMin', parseFloat(e.target.value))}
            style={{ flex: 1 }}
          />
          <input
            type="range"
            min={dataRanges.koiTeqMin}
            max={dataRanges.koiTeqMax}
            step="10"
            value={tempFilters.koiTeqMax}
            onChange={(e) => handleChange('koiTeqMax', parseFloat(e.target.value))}
            style={{ flex: 1 }}
          />
        </div>
      </div>

      {/* Insolación */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          <strong>Insolación (F⊕): </strong>
          <span style={{ color: '#0ff' }}>
            {tempFilters.koiInsolMin.toFixed(2)} - {tempFilters.koiInsolMax.toFixed(2)}
          </span>
        </label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="range"
            min={dataRanges.koiInsolMin}
            max={dataRanges.koiInsolMax}
            step="0.1"
            value={tempFilters.koiInsolMin}
            onChange={(e) => handleChange('koiInsolMin', parseFloat(e.target.value))}
            style={{ flex: 1 }}
          />
          <input
            type="range"
            min={dataRanges.koiInsolMin}
            max={dataRanges.koiInsolMax}
            step="0.1"
            value={tempFilters.koiInsolMax}
            onChange={(e) => handleChange('koiInsolMax', parseFloat(e.target.value))}
            style={{ flex: 1 }}
          />
        </div>
      </div>

      {/* Temperatura efectiva estelar */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          <strong>Temp. Estelar (K): </strong>
          <span style={{ color: '#0ff' }}>
            {tempFilters.koiSteffMin.toFixed(0)} - {tempFilters.koiSteffMax.toFixed(0)}
          </span>
        </label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="range"
            min={dataRanges.koiSteffMin}
            max={dataRanges.koiSteffMax}
            step="50"
            value={tempFilters.koiSteffMin}
            onChange={(e) => handleChange('koiSteffMin', parseFloat(e.target.value))}
            style={{ flex: 1 }}
          />
          <input
            type="range"
            min={dataRanges.koiSteffMin}
            max={dataRanges.koiSteffMax}
            step="50"
            value={tempFilters.koiSteffMax}
            onChange={(e) => handleChange('koiSteffMax', parseFloat(e.target.value))}
            style={{ flex: 1 }}
          />
        </div>
      </div>

      {/* Radio estelar */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          <strong>Radio Estelar (R☉): </strong>
          <span style={{ color: '#0ff' }}>
            {tempFilters.koiSradMin.toFixed(2)} - {tempFilters.koiSradMax.toFixed(2)}
          </span>
        </label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="range"
            min={dataRanges.koiSradMin}
            max={dataRanges.koiSradMax}
            step="0.1"
            value={tempFilters.koiSradMin}
            onChange={(e) => handleChange('koiSradMin', parseFloat(e.target.value))}
            style={{ flex: 1 }}
          />
          <input
            type="range"
            min={dataRanges.koiSradMin}
            max={dataRanges.koiSradMax}
            step="0.1"
            value={tempFilters.koiSradMax}
            onChange={(e) => handleChange('koiSradMax', parseFloat(e.target.value))}
            style={{ flex: 1 }}
          />
        </div>
      </div>

      {/* Botones de acción */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={handleApply}
          style={{
            flex: 1,
            padding: '12px 20px',
            backgroundColor: '#0ff',
            color: '#000',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '1rem',
            boxShadow: '0 0 10px #0ff',
            transition: 'all 0.3s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 0 20px #0ff';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 0 10px #0ff';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          🔍 Aplicar Filtros
        </button>
        
        <button
          onClick={handleReset}
          style={{
            padding: '12px 20px',
            backgroundColor: '#ff4d4d',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '1rem',
            transition: 'all 0.3s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#ff6b6b';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ff4d4d';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          🔄 Reset
        </button>
      </div>
    </div>
  );
};

export default ExoplanetFilters;