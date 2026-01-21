import { memo } from 'react';
import { DollarSign, AlertCircle, Activity, Layers } from 'lucide-react';
import { useExchangeRate } from "@/context/ExchangeRateContext";

interface StatsGridProps {
    loading: boolean;
    realIncome: number;
    pendingPayments: number;
    activeOrders: number;
    estimatedProfit: number;
}

const StatsGrid = memo(function StatsGrid({ loading, realIncome, pendingPayments, activeOrders, estimatedProfit }: StatsGridProps) {
    const { formatBs } = useExchangeRate();

    return (
        <section>
            <h2 className="text-xl font-bold text-white mb-6 tracking-tight">Resumen Financiero</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Ingresos Reales"
                    value={realIncome}
                    loading={loading}
                    formatValue
                    secondaryValue={formatBs(realIncome)}
                    icon={DollarSign}
                    iconColor="text-emerald-400"
                    gradient="from-emerald-500/20 to-teal-500/5"
                    borderColor="hover:border-emerald-500/30"
                />

                <StatCard
                    title="Por Cobrar"
                    value={pendingPayments}
                    loading={loading}
                    formatValue
                    secondaryValue={formatBs(pendingPayments)}
                    icon={AlertCircle}
                    iconColor="text-red-400"
                    gradient="from-red-500/20 to-orange-500/5"
                    borderColor="hover:border-red-500/30"
                />

                <StatCard
                    title="Pedidos Activos"
                    value={activeOrders}
                    loading={loading}
                    icon={Activity}
                    iconColor="text-amber-400"
                    gradient="from-amber-500/20 to-yellow-500/5"
                    borderColor="hover:border-amber-500/30"
                />

                <StatCard
                    title="Ganancia (Est.)"
                    value={estimatedProfit}
                    loading={loading}
                    formatValue
                    secondaryValue={formatBs(estimatedProfit)}
                    icon={Layers}
                    iconColor="text-indigo-400"
                    gradient="from-indigo-500/20 to-violet-500/5"
                    borderColor="hover:border-indigo-500/30"
                />
            </div>
        </section>
    );
});

const StatCard = memo(function StatCard({ title, value, loading, formatValue, secondaryValue, icon: Icon, iconColor, gradient, borderColor }: any) {
    return (
        <div className={`relative p-5 rounded-3xl border border-white/10 bg-gradient-to-br ${gradient} backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 ${borderColor} shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/20`}>
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 ${iconColor} shadow-inner shadow-black/20`}>
                    <Icon size={24} />
                </div>
                {/* Optional decorative element */}
                <div className={`w-20 h-20 rounded-full blur-3xl absolute -top-10 -right-10 opacity-30 bg-current ${iconColor}`} />
            </div>

            <div className="relative z-10">
                <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 opacity-90">{title}</p>
                <p className="text-2xl font-bold text-white tracking-tight">
                    {loading ? (
                        <span className="inline-block w-24 h-8 bg-white/10 rounded-lg animate-pulse" />
                    ) : (
                        <>
                            {formatValue ? '$' : ''}{Number(value).toLocaleString(undefined, { minimumFractionDigits: formatValue ? 2 : 0 })}
                        </>
                    )}
                </p>
                {secondaryValue && !loading && (
                    <div className={`mt-2 flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-lg border border-white/10 w-fit ${iconColor}`}>
                        <span className="text-[10px] font-bold opacity-70">Bs:</span>
                        <span className="text-xs font-mono font-bold tracking-tight">{secondaryValue}</span>
                    </div>
                )}
            </div>
        </div>
    )
});

export default StatsGrid;
