"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { StockItem, getStockItems } from "@/services/storage";
import { useAuth } from "./AuthContext";
import { logger } from "@/lib/logger";

interface StockContextType {
    stockItems: StockItem[];
    loading: boolean;
    error: string | null;
    refreshStock: () => Promise<void>;
    getStockByGarmentId: (garmentId: string) => number;
}

const StockContext = createContext<StockContextType>({} as StockContextType);

export const StockProvider = ({ children }: { children: ReactNode }) => {
    const { user, role } = useAuth();
    const [stockItems, setStockItems] = useState<StockItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refreshStock = useCallback(async () => {
        if (!user?.uid) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await getStockItems(role || undefined, user.uid);
            setStockItems(data);
        } catch (err) {
            console.error("Error fetching stock:", err);
            setError("No se pudo cargar el inventario");
        } finally {
            setLoading(false);
        }
    }, [user?.uid, role]);

    useEffect(() => {
        let cancelled = false;

        const loadStock = async () => {
            if (!user?.uid) {
                setStockItems([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const data = await getStockItems(role || undefined, user.uid);
                if (!cancelled) {
                    setStockItems(data);
                }
            } catch (err) {
                if (!cancelled) {
                    logger.error("Error fetching stock", err as Error, { component: 'StockContext' });
                    setError("No se pudo cargar el inventario");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadStock();

        return () => {
            cancelled = true;
        };
    }, [user?.uid, role]);

    // ✅ Helper para obtener cantidad disponible por garmentId
    const getStockByGarmentId = useCallback((garmentId: string): number => {
        if (!garmentId) return 0;
        const item = stockItems.find(i => i.garmentId === garmentId && i.quantity > 0);
        return item?.quantity ?? 0;
    }, [stockItems]);

    return (
        <StockContext.Provider value={{ stockItems, loading, error, refreshStock, getStockByGarmentId }}>
            {children}
        </StockContext.Provider>
    );
};

export const useStock = () => {
    const context = useContext(StockContext);
    if (!context) {
        throw new Error("useStock must be used within StockProvider");
    }
    return context;
};
