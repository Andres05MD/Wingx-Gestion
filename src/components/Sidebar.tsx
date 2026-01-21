"use client";

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Home, Shirt, Package, ClipboardList, Users, ShoppingCart, X, Calendar, LogOut, ShieldCheck, LayoutDashboard, ShoppingBag, CreditCard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationsContext';
import ExchangeRateWidget from './ExchangeRateWidget';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const links = [
    { name: 'Prendas', href: '/prendas', icon: Shirt },
    { name: 'En Stock', href: '/inventario', icon: Package },
    { name: 'Tienda Online', href: '/tienda', icon: ShoppingBag },
    { name: 'Verificar Pagos', href: '/verificacion-pagos', icon: CreditCard },
    { name: 'Pedidos', href: '/pedidos', icon: ClipboardList },
    { name: 'Agenda', href: '/agenda', icon: Calendar },
    { name: 'Clientes', href: '/clientes', icon: Users },
    { name: 'Materiales', href: '/materiales', icon: ShoppingCart },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const viewMode = searchParams.get('view');
    const { logout, role } = useAuth();
    const { pendingCount, hasNewOrders, clearNewOrders } = useNotifications();

    const handleLinkClick = () => {
        if (window.innerWidth < 1024) onClose();
    };

    const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

    return (
        <aside
            className={`fixed inset-x-0 bottom-0 z-50 w-full lg:w-[280px] lg:inset-y-0 lg:left-0 lg:bottom-auto transform transition-transform duration-300 ease-out 
                ${isOpen ? 'translate-y-0 lg:translate-x-0' : 'translate-y-full lg:-translate-x-full lg:translate-y-0'} 
                lg:static lg:h-screen lg:bg-transparent h-full lg:h-auto shadow-none bg-[#0f172a] lg:bg-transparent`}
        >
            <div className="h-full lg:p-4">
                <div className="h-full flex flex-col bg-slate-900/80 backdrop-blur-xl border-r border-white/5 lg:border lg:rounded-2xl lg:shadow-2xl lg:shadow-black/20">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 pb-2 relative">
                        <Link href="/" className="flex items-center gap-3 group" onClick={onClose}>
                            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-xl shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform duration-300">
                                <span className="relative z-10">W</span>
                                <div className="absolute inset-0 rounded-xl bg-white/20 blur opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xl font-bold text-white tracking-tight">Wingx</span>
                                {role === 'admin' && (
                                    <span className="text-[10px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 uppercase tracking-widest">
                                        Admin Panel
                                    </span>
                                )}
                            </div>
                        </Link>
                        <button
                            onClick={onClose}
                            className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-6 scrollbar-thin">
                        <div className="px-3 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            Principal
                        </div>
                        {links.filter(link => {
                            // Ocultar Tienda Online y Verificación de Pagos si no es admin ni store
                            if (link.href === '/tienda' || link.href === '/verificacion-pagos') {
                                return role === 'admin' || role === 'store';
                            }
                            return true;
                        }).map((link) => {
                            const active = isActive(link.href);
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={handleLinkClick}
                                    className={`relative flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 group overflow-hidden ${active
                                        ? 'text-white shadow-lg shadow-blue-500/10'
                                        : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                                        }`}
                                >
                                    {active && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border-l-2 border-blue-500" />
                                    )}
                                    <link.icon
                                        size={20}
                                        className={`relative z-10 transition-colors duration-300 ${active ? 'text-blue-400' : 'text-slate-500 group-hover:text-blue-400'
                                            }`}
                                    />
                                    <span className="relative z-10">{link.name}</span>
                                    {/* Badge de notificaciones para Verificar Pagos */}
                                    {link.href === '/verificacion-pagos' && pendingCount > 0 && (
                                        <span className={`absolute right-3 top-1/2 -translate-y-1/2 min-w-[20px] h-5 px-1.5 flex items-center justify-center text-[10px] font-bold rounded-full ${hasNewOrders ? 'bg-red-500 animate-pulse' : 'bg-amber-500'} text-white shadow-lg`}>
                                            {pendingCount > 99 ? '99+' : pendingCount}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t border-white/5 space-y-3 bg-black/10">
                        {role === 'admin' && (
                            <Link
                                href={viewMode === 'user' ? '/' : '/?view=user'}
                                onClick={onClose}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all duration-200 group border border-dashed border-slate-700/50 hover:border-slate-500/50"
                            >
                                {viewMode === 'user' ? (
                                    <ShieldCheck size={18} className="text-slate-500 group-hover:text-emerald-400 transition-colors" />
                                ) : (
                                    <LayoutDashboard size={18} className="text-slate-500 group-hover:text-amber-400 transition-colors" />
                                )}
                                <span>{viewMode === 'user' ? 'Volver a Admin' : 'Vista Usuario'}</span>
                            </Link>
                        )}

                        <div className="rounded-xl bg-slate-950/30 border border-white/5 p-1 overflow-hidden">
                            <ExchangeRateWidget />
                        </div>

                        <button
                            onClick={logout}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 group"
                        >
                            <LogOut
                                size={18}
                                className="text-slate-500 group-hover:text-red-400 transition-colors duration-200"
                            />
                            <span>Cerrar Sesión</span>
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
}
