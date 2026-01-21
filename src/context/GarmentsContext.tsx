"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Garment, getGarments } from "@/services/storage";
import { useAuth } from "./AuthContext";
import { logger } from "@/lib/logger";

interface GarmentsContextType {
    garments: Garment[];
    loading: boolean;
    error: string | null;
    refreshGarments: () => Promise<void>;
}

const GarmentsContext = createContext<GarmentsContextType>({} as GarmentsContextType);

export const GarmentsProvider = ({ children }: { children: ReactNode }) => {
    const { user, role } = useAuth();
    const [garments, setGarments] = useState<Garment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refreshGarments = useCallback(async () => {
        if (!user?.uid) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await getGarments(role || undefined, user.uid);
            setGarments(data);
        } catch (err) {
            console.error("Error fetching garments:", err);
            setError("No se pudieron cargar las prendas");
        } finally {
            setLoading(false);
        }
    }, [user?.uid, role]);

    useEffect(() => {
        let cancelled = false;

        const loadGarments = async () => {
            if (!user?.uid) {
                setGarments([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const data = await getGarments(role || undefined, user.uid);
                if (!cancelled) {
                    setGarments(data);
                }
            } catch (err) {
                if (!cancelled) {
                    logger.error("Error fetching garments", err as Error, { component: 'GarmentsContext' });
                    setError("No se pudieron cargar las prendas");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadGarments();

        return () => {
            cancelled = true;
        };
    }, [user?.uid, role]);

    return (
        <GarmentsContext.Provider value={{ garments, loading, error, refreshGarments }}>
            {children}
        </GarmentsContext.Provider>
    );
};

export const useGarments = () => {
    const context = useContext(GarmentsContext);
    if (!context) {
        throw new Error("useGarments must be used within GarmentsProvider");
    }
    return context;
};
