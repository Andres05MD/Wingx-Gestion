import Link from 'next/link';
import {
    ClipboardPlus,
    ShoppingCart,
    Shirt,
    Calendar,
    Users,
    Package
} from 'lucide-react';

export default function QuickActions() {
    return (
        <section>
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 tracking-tight">
                Acciones Rápidas
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <ActionCard
                    href="/pedidos"
                    icon={ClipboardPlus}
                    label="Nuevo Pedido"
                    colorClass="text-blue-400 group-hover:text-blue-300"
                    bgClass="from-blue-500/10 to-blue-500/5 group-hover:from-blue-500/20 group-hover:to-blue-500/10"
                    borderClass="group-hover:border-blue-500/30"
                />
                <ActionCard
                    href="/materiales"
                    icon={ShoppingCart}
                    label="Materiales"
                    colorClass="text-emerald-400 group-hover:text-emerald-300"
                    bgClass="from-emerald-500/10 to-emerald-500/5 group-hover:from-emerald-500/20 group-hover:to-emerald-500/10"
                    borderClass="group-hover:border-emerald-500/30"
                />
                <ActionCard
                    href="/prendas"
                    icon={Shirt}
                    label="Nueva Prenda"
                    colorClass="text-purple-400 group-hover:text-purple-300"
                    bgClass="from-purple-500/10 to-purple-500/5 group-hover:from-purple-500/20 group-hover:to-purple-500/10"
                    borderClass="group-hover:border-purple-500/30"
                />
                <ActionCard
                    href="/agenda"
                    icon={Calendar}
                    label="Ver Agenda"
                    colorClass="text-pink-400 group-hover:text-pink-300"
                    bgClass="from-pink-500/10 to-pink-500/5 group-hover:from-pink-500/20 group-hover:to-pink-500/10"
                    borderClass="group-hover:border-pink-500/30"
                />
                <ActionCard
                    href="/clientes"
                    icon={Users}
                    label="Ver Clientes"
                    colorClass="text-cyan-400 group-hover:text-cyan-300"
                    bgClass="from-cyan-500/10 to-cyan-500/5 group-hover:from-cyan-500/20 group-hover:to-cyan-500/10"
                    borderClass="group-hover:border-cyan-500/30"
                />
                <ActionCard
                    href="/inventario"
                    icon={Package}
                    label="Ver Stock"
                    colorClass="text-orange-400 group-hover:text-orange-300"
                    bgClass="from-orange-500/10 to-orange-500/5 group-hover:from-orange-500/20 group-hover:to-orange-500/10"
                    borderClass="group-hover:border-orange-500/30"
                />
            </div>
        </section>
    );
}

function ActionCard({ href, icon: Icon, label, colorClass, bgClass, borderClass }: any) {
    return (
        <Link href={href} className={`group relative p-4 rounded-3xl border border-white/10 transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br ${bgClass} ${borderClass} overflow-hidden backdrop-blur-md hover:shadow-lg hover:shadow-black/20`}>
            {/* Glossy overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/[0.07] to-white/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <div className="flex flex-col items-center justify-center gap-4 text-center relative z-10">
                <div className={`p-4 rounded-2xl bg-black/20 border border-white/10 shadow-lg ${colorClass} group-hover:scale-110 transition-transform duration-300 group-hover:bg-black/30`}>
                    <Icon size={28} />
                </div>
                <span className="font-semibold text-slate-200 text-sm tracking-wide group-hover:text-white transition-colors">{label}</span>
            </div>
        </Link>
    )
}
