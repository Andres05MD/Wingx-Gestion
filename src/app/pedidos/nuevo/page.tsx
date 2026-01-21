"use client";

import dynamic from 'next/dynamic';

// ✨ Lazy loading del formulario más pesado (674 líneas!)
const OrderForm = dynamic(() => import("@/components/OrderForm"), {
    loading: () => (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 flex items-center justify-center">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-slate-400">Cargando formulario...</p>
            </div>
        </div>
    ),
    ssr: false
});

export default function NewOrderPage() {
    return (
        <div>
            <OrderForm />
        </div>
    );
}
