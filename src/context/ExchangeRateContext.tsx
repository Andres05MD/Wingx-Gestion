"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

interface ExchangeRateContextType {
    rate: number;
    loading: boolean;
    error: string | null;
    convertToBs: (usdAmount: number) => number;
    formatBs: (usdAmount: number) => string;
    refreshRate: () => Promise<void>;
}

const ExchangeRateContext = createContext<ExchangeRateContextType>({} as ExchangeRateContextType);

// Configuración de caché
const CACHE_KEY = 'wingx_exchange_rate_cache';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hora
const DEFAULT_RATE = 50; // Tasa de respaldo en caso de fallo total

interface CachedRate {
    rate: number;
    timestamp: number;
}

export const ExchangeRateProvider = ({ children }: { children: React.ReactNode }) => {
    const [rate, setRate] = useState<number>(DEFAULT_RATE); // Usar tasa por defecto inicialmente
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRate = useCallback(async () => {
        try {
            // 1. Verificar caché primero
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const { rate: cachedRate, timestamp }: CachedRate = JSON.parse(cached);
                const cacheAge = Date.now() - timestamp;

                if (cacheAge < CACHE_DURATION) {
                    // Caché válida - usar inmediatamente
                    setRate(cachedRate);
                    setLoading(false);
                    setError(null);
                    return;
                }
            }

            // 2. Caché expirada o no existe - fetch nueva tasa
            const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
            if (!response.ok) throw new Error("Failed to fetch rate");

            const data = await response.json();
            if (data && data.promedio) {
                const newRate = data.promedio;
                setRate(newRate);
                setError(null);

                // 3. Guardar en caché
                localStorage.setItem(CACHE_KEY, JSON.stringify({
                    rate: newRate,
                    timestamp: Date.now()
                } as CachedRate));
            } else {
                throw new Error("Invalid data format");
            }
        } catch (err) {
            // Solo mostrar warning, no error (es esperado que falle a veces)
            console.warn("⚠️ No se pudo obtener tasa de cambio actualizada:", err instanceof Error ? err.message : 'Error desconocido');

            // 4. Fallback: Intentar usar última tasa conocida aunque esté expirada
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                try {
                    const { rate: cachedRate }: CachedRate = JSON.parse(cached);
                    setRate(cachedRate);
                    setError("Usando tasa en caché");
                    console.warn("📦 Usando tasa de cambio en caché (puede estar desactualizada)");
                } catch {
                    // Si falla parsear caché, usar tasa por defecto
                    setRate(DEFAULT_RATE);
                    setError("Usando tasa por defecto");
                    console.warn(`💱 Usando tasa de respaldo: ${DEFAULT_RATE} Bs/$`);
                }
            } else {
                // No hay caché - usar tasa por defecto
                setRate(DEFAULT_RATE);
                setError("Usando tasa por defecto");
                console.warn(`💱 No hay caché disponible. Usando tasa de respaldo: ${DEFAULT_RATE} Bs/$`);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    const refreshRate = useCallback(async () => {
        setLoading(true);
        // Forzar actualización limpiando la caché
        localStorage.removeItem(CACHE_KEY);
        await fetchRate();
    }, [fetchRate]);

    useEffect(() => {
        // ✅ Llamar inmediatamente
        fetchRate();

        // ✅ Intervalo seguro - fetchRate se mantiene en ref interna de useCallback
        const interval = setInterval(() => {
            fetchRate();
        }, CACHE_DURATION);

        return () => clearInterval(interval);
        // ✅ Solo ejecutar una vez al montar, fetchRate es estable por useCallback
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const convertToBs = useCallback((usdAmount: number) => {
        if (!rate) return 0;
        return usdAmount * rate;
    }, [rate]);

    const formatBs = useCallback((usdAmount: number) => {
        const bsAmount = convertToBs(usdAmount);
        return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(bsAmount);
    }, [convertToBs]);

    return (
        <ExchangeRateContext.Provider value={{ rate, loading, error, convertToBs, formatBs, refreshRate }}>
            {children}
        </ExchangeRateContext.Provider>
    );
};

export const useExchangeRate = () => useContext(ExchangeRateContext);
