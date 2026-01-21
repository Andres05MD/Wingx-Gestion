"use client";
import { useExchangeRate } from "@/context/ExchangeRateContext";

export default function ExchangeRateWidget() {
    const { rate, loading, error } = useExchangeRate();

    if (loading) return <div className="animate-pulse bg-slate-800 h-8 w-24 rounded"></div>;

    // If error or 0, maybe don't show or show fallback
    if (error || !rate) return null;

    return (
        <div className="flex flex-col sm:flex-row items-center gap-2 px-4 py-2 bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 shadow-lg group hover:border-emerald-500/30 transition-all duration-300">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></div>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Tasa BCV</span>
            </div>
            <span className="text-sm font-bold text-white font-mono bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                {new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(rate)}
            </span>
        </div>
    );
}
