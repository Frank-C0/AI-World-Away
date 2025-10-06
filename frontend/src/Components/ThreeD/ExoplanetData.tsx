import React, { useEffect, useState } from 'react';
import { useDataStore } from '../../store/dataStore';
import ExoplanetFilters from './ExoplanetFilters';

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

interface ExoplanetDataProps {
    onFilteredDataChange?: (total: number) => void;
    }

    const getField = (planet: any, keys: string[]): any => {
    if (!planet) return undefined;

    if (typeof planet.get === 'function') {
        for (const k of keys) {
        try {
            const v = planet.get(k);
            if (v !== undefined) return v;
        } catch (e) {
            // ignore
        }
        }
    }

    for (const k of keys) {
        if (planet[k] !== undefined) return planet[k];
    }

    return undefined;
    };

    const minMaxOrFallback = (arr: number[], fallbackMin = 0, fallbackMax = 1) => {
    if (!arr || arr.length === 0) return { min: fallbackMin, max: fallbackMax };
    return { min: Math.min(...arr), max: Math.max(...arr) };
    };

    const ExoplanetaData: React.FC<ExoplanetDataProps> = ({ onFilteredDataChange }) => {
    const { data, loading, error } = useDataStore();
    const [exoplanets, setExoplanets] = useState<any[]>([]);
    const [filters, setFilters] = useState<Filters | null>(null);
    const [dataRanges, setDataRanges] = useState<Filters | null>(null);

    // 1) Process: data arrives, calculate real ranges and set initial filters
    useEffect(() => {
        if (!data || data.length === 0) return;

        console.log("- Original data loaded:", data.length);
        console.log("Example data (raw):", data[0]);

        const scores: number[] = [];
        const periods: number[] = [];
        const prads: number[] = [];
        const teqs: number[] = [];
        const insols: number[] = [];
        const steffs: number[] = [];
        const srads: number[] = [];

        data.forEach((planet: any) => {
        const s = Number(getField(planet, ['koi_score', 'koiScore']));
        if (!isNaN(s)) scores.push(s);

        const p = Number(getField(planet, ['koi_period', 'koiPeriod']));
        if (!isNaN(p)) periods.push(p);

        const pr = Number(getField(planet, ['koi_prad', 'koiPrad']));
        if (!isNaN(pr)) prads.push(pr);

        const t = Number(getField(planet, ['koi_teq', 'koiTeq']));
        if (!isNaN(t)) teqs.push(t);

        const ins = Number(getField(planet, ['koi_insol', 'koiInsol']));
        if (!isNaN(ins)) insols.push(ins);

        const st = Number(getField(planet, ['koi_steff', 'koiSteff']));
        if (!isNaN(st)) steffs.push(st);

        const sr = Number(getField(planet, ['koi_srad', 'koiSrad']));
        if (!isNaN(sr)) srads.push(sr);
        });

        const scoreMM = minMaxOrFallback(scores, 0, 1);
        const periodMM = minMaxOrFallback(periods, 0, 1000);
        const pradMM = minMaxOrFallback(prads, 0.1, 10);
        const teqMM = minMaxOrFallback(teqs, 100, 1000);
        const insolMM = minMaxOrFallback(insols, 0, 10);
        const steffMM = minMaxOrFallback(steffs, 3000, 8000);
        const sradMM = minMaxOrFallback(srads, 0.1, 3);

        const ranges: Filters = {
        koiDisposition: 'all',
        koiScoreMin: scoreMM.min, koiScoreMax: scoreMM.max,
        koiPeriodMin: periodMM.min, koiPeriodMax: periodMM.max,
        koiPradMin: pradMM.min, koiPradMax: pradMM.max,
        koiTeqMin: teqMM.min, koiTeqMax: teqMM.max,
        koiInsolMin: insolMM.min, koiInsolMax: insolMM.max,
        koiSteffMin: steffMM.min, koiSteffMax: steffMM.max,
        koiSradMin: sradMM.min, koiSradMax: sradMM.max,
        };

        setDataRanges(ranges);
        setFilters((prev) => prev ?? { ...ranges });

        console.log("📊 Calculated ranges:", ranges);
    }, [data]);

    // 2) Filter and notify parent component
    useEffect(() => {
        if (!data || data.length === 0) {
        if (onFilteredDataChange) {
            onFilteredDataChange(0);
        }
        return;
        }
        if (!filters) return;

        const filtered = data.filter((planet: any) => {
        const dispo = getField(planet, ['koi_disposition', 'koiDisposition']);
        if (filters.koiDisposition !== 'all' && dispo !== undefined) {
            if (String(dispo) !== String(filters.koiDisposition)) return false;
        }

        const s = Number(getField(planet, ['koi_score', 'koiScore']));
        if (isNaN(s) || s < filters.koiScoreMin || s > filters.koiScoreMax) return false;

        const p = Number(getField(planet, ['koi_period', 'koiPeriod']));
        if (isNaN(p) || p < filters.koiPeriodMin || p > filters.koiPeriodMax) return false;

        const pr = Number(getField(planet, ['koi_prad', 'koiPrad']));
        if (isNaN(pr) || pr < filters.koiPradMin || pr > filters.koiPradMax) return false;

        const t = Number(getField(planet, ['koi_teq', 'koiTeq']));
        if (isNaN(t) || t < filters.koiTeqMin || t > filters.koiTeqMax) return false;

        const ins = Number(getField(planet, ['koi_insol', 'koiInsol']));
        if (isNaN(ins) || ins < filters.koiInsolMin || ins > filters.koiInsolMax) return false;

        const st = Number(getField(planet, ['koi_steff', 'koiSteff']));
        if (isNaN(st) || st < filters.koiSteffMin || st > filters.koiSteffMax) return false;

        const sr = Number(getField(planet, ['koi_srad', 'koiSrad']));
        if (isNaN(sr) || sr < filters.koiSradMin || sr > filters.koiSradMax) return false;

        return true;
        });

        console.log("Exoplanets after filtering:", filtered.length);
        if (filtered.length > 0) console.log("Filtered example:", filtered[0]);
        else console.log("⚠️ No exoplanets found matching the filters.");

        setExoplanets(filtered);

        if (onFilteredDataChange) {
        onFilteredDataChange(filtered.length);
        console.log("Notifying Interface update:", filtered.length, "planets");
        }
    }, [data, filters, onFilteredDataChange]);

    const handleFiltersChange = (newFilters: Filters) => {
        setFilters(newFilters);
    };

    if (loading) return <p>Loading data...</p>;
    if (error) return <p>Error loading data: {error}</p>;

    return (
        <div>
        <h2 style={{ color: '#0ff', marginTop: 0 }}>Exoplanets</h2>

        {!filters || !dataRanges ? (
            <p>Calculating ranges from dataset…</p>
        ) : (
            <ExoplanetFilters
            onChange={handleFiltersChange}
            filtrosActuales={filters}
            dataRanges={dataRanges}
            />
        )}

        <div style={{
            padding: '15px',
            background: 'rgba(0, 255, 255, 0.1)',
            border: '2px solid #0ff',
            borderRadius: '8px',
            marginTop: '20px',
            textAlign: 'center'
        }}>
            <h3 style={{ color: '#0ff', margin: '0', fontSize: '1.5rem' }}>
            Total filtered: <span style={{ color: '#fff' }}>{exoplanets.length}</span>
            </h3>
        </div>
        </div>
    );
};

export default ExoplanetaData;