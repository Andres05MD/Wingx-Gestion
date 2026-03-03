"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Bolso, getBolsos } from "@/services/storage";
import { useAuth } from "./AuthContext";
import { logger } from "@/lib/logger";

interface BolsosContextType {
    bolsos: Bolso[];
    loading: boolean;
    error: string | null;
    refreshBolsos: () => Promise<void>;
}

const BolsosContext = createContext<BolsosContextType>({} as BolsosContextType);

export const BolsosProvider = ({ children }: { children: ReactNode }) => {
    const { user, role } = useAuth();
    const [bolsos, setBolsos] = useState<Bolso[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refreshBolsos = useCallback(async () => {
        if (!user?.uid) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await getBolsos(role || undefined, user.uid);
            setBolsos(data);
        } catch (err) {
            console.error("Error fetching bolsos:", err);
            setError("No se pudieron cargar los bolsos");
        } finally {
            setLoading(false);
        }
    }, [user?.uid, role]);

    useEffect(() => {
        let cancelled = false;

        const loadBolsos = async () => {
            if (!user?.uid) {
                setBolsos([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const data = await getBolsos(role || undefined, user.uid);
                if (!cancelled) {
                    setBolsos(data);
                }
            } catch (err) {
                if (!cancelled) {
                    logger.error("Error fetching bolsos", err as Error, { component: 'BolsosContext' });
                    setError("No se pudieron cargar los bolsos");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadBolsos();

        return () => {
            cancelled = true;
        };
    }, [user?.uid, role]);

    return (
        <BolsosContext.Provider value={{ bolsos, loading, error, refreshBolsos }}>
            {children}
        </BolsosContext.Provider>
    );
};

export const useBolsos = () => {
    const context = useContext(BolsosContext);
    if (!context) {
        throw new Error("useBolsos must be used within BolsosProvider");
    }
    return context;
};
