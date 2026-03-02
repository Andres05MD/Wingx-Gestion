"use client";

import dynamic from 'next/dynamic';

// ✨ Lazy loading del formulario pesado (387 líneas)
const GarmentForm = dynamic(() => import("@/components/GarmentForm"), {
    loading: () => (
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-6 flex items-center justify-center">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
                <p className="text-zinc-400">Cargando formulario...</p>
            </div>
        </div>
    ),
    ssr: false // No renderizar en servidor para reducir bundle inicial
});

export default function NewGarmentPage() {
    return (
        <div>
            <GarmentForm />
        </div>
    );
}
