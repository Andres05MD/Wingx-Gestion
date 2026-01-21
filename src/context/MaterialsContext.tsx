"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Material, getMaterials } from "@/services/storage";
import { useAuth } from "./AuthContext";

interface MaterialsContextType {
    materials: Material[];
    loading: boolean;
    error: string | null;
    refreshMaterials: () => Promise<void>;
}

const MaterialsContext = createContext<MaterialsContextType>({} as MaterialsContextType);

export const MaterialsProvider = ({ children }: { children: ReactNode }) => {
    const { user, role } = useAuth();
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refreshMaterials = useCallback(async () => {
        if (!user?.uid) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await getMaterials(role || undefined, user.uid);
            setMaterials(data);
        } catch (err) {
            console.error("Error fetching materials:", err);
            setError("No se pudieron cargar los materiales");
        } finally {
            setLoading(false);
        }
    }, [user?.uid, role]);

    useEffect(() => {
        let cancelled = false;

        const loadMaterials = async () => {
            if (!user?.uid) {
                setMaterials([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const data = await getMaterials(role || undefined, user.uid);
                if (!cancelled) {
                    setMaterials(data);
                }
            } catch (err) {
                if (!cancelled) {
                    console.error("Error fetching materials:", err);
                    setError("No se pudieron cargar los materiales");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadMaterials();

        return () => {
            cancelled = true;
        };
    }, [user?.uid, role]);

    return (
        <MaterialsContext.Provider value={{ materials, loading, error, refreshMaterials }}>
            {children}
        </MaterialsContext.Provider>
    );
};

export const useMaterials = () => {
    const context = useContext(MaterialsContext);
    if (!context) {
        throw new Error("useMaterials must be used within MaterialsProvider");
    }
    return context;
};
