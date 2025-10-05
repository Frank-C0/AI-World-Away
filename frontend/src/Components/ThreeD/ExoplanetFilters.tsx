import React, { useState } from "react";
import "./styles/filters.css";

interface ExoplanetFiltersProps {
  onChange: (filters: { distance: number; size: number; color: string }) => void;
}

const ExoplanetFilters: React.FC<ExoplanetFiltersProps> = ({ onChange }) => {
  const [distance, setDistance] = useState(100);
  const [size, setSize] = useState(0.4);
  const [color, setColor] = useState("all");

  const handleChange = () => {
    onChange({ distance, size, color });
  };

  return (
    <div className="filters-panel">
      <h3>Filtros de Exoplanetas</h3>

      <div className="filter-group">
        <label>Distancia máx.: {distance}</label>
        <input
          type="range"
          min="10"
          max="200"
          step="5"
          value={distance}
          onChange={(e) => {
            setDistance(Number(e.target.value));
            handleChange();
          }}
        />
      </div>

      <div className="filter-group">
        <label>Tamaño del planeta: {size.toFixed(2)}</label>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.1"
          value={size}
          onChange={(e) => {
            setSize(Number(e.target.value));
            handleChange();
          }}
        />
      </div>

      <div className="filter-group">
        <label>Color:</label>
        <select
          value={color}
          onChange={(e) => {
            setColor(e.target.value);
            handleChange();
          }}
        >
          <option value="all">Todos</option>
          <option value="#ff4d4d">Rojo</option>
          <option value="#00ff7f">Verde</option>
          <option value="#ffff66">Amarillo</option>
        </select>
      </div>
    </div>
  );
};

export default ExoplanetFilters;
