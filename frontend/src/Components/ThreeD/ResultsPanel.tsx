import React from "react";
import "./styles/results.css";

interface Exoplanet {
    koiName: string;
    koiScore: number;
    koiPeriod: number;
    koiPrad: number;
    koiTeq: number;
}

interface ResultsPanelProps {
    exoplanets: Exoplanet[];
    }

    const ResultsPanel: React.FC<ResultsPanelProps> = ({ exoplanets }) => {
    return (
        <div className="results-panel">
        <h3>🌍 Exoplanetas Filtrados</h3>

        {exoplanets.length === 0 ? (
            <p>No se encontraron exoplanetas con los filtros actuales.</p>
        ) : (
            <ul>
            {exoplanets.map((planet, index) => (
                <li key={index} className="planet-item">
                <h4>{planet.koiName}</h4>
                <p>Confianza: {planet.koiScore.toFixed(2)}</p>
                <p>Periodo orbital: {planet.koiPeriod} días</p>
                <p>Tamaño: {planet.koiPrad} R⊕</p>
                <p>Temperatura: {planet.koiTeq} K</p>
                </li>
            ))}
            </ul>
        )}
        </div>
    );
};

export default ResultsPanel;
