"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';
import { Shirt, Package, ClipboardList, Users, ShoppingCart, X, Calendar, LogOut, ShieldCheck, LayoutDashboard, ShoppingBag, CreditCard, Wallet } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationsContext';
import ExchangeRateWidget from './ExchangeRateWidget';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const mainLinks = [
    { name: 'Pedidos', href: '/pedidos', icon: ClipboardList },
    { name: 'Agenda', href: '/agenda', icon: Calendar },
    { name: 'Clientes', href: '/clientes', icon: Users },
];

const productLinks = [
    { name: 'Prendas', href: '/prendas', icon: Shirt },
    { name: 'Bolsos', href: '/bolsos', icon: Wallet },
    { name: 'En Stock', href: '/inventario', icon: Package },
    { name: 'Materiales', href: '/materiales', icon: ShoppingCart },
];

const storeLinks = [
    { name: 'Tienda Online', href: '/tienda', icon: ShoppingBag },
    { name: 'Verificar Pagos', href: '/verificacion-pagos', icon: CreditCard },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const viewMode = searchParams.get('view');
    const { logout, role } = useAuth();
    const { pendingCount, hasNewOrders } = useNotifications();

    const handleLinkClick = () => {
        if (window.innerWidth < 1024) onClose();
    };

    const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

    const renderLink = (link: { name: string; href: string; icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }> }) => {
        const active = isActive(link.href);
        return (
            <Link
                key={link.href}
                href={link.href}
                onClick={handleLinkClick}
                className={`relative flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group overflow-hidden ${active
                    ? 'text-white bg-white/10'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5 active:scale-[0.98]'
                    }`}
            >
                {active && (
                    <div className="absolute inset-y-0 left-0 w-0.5 bg-white rounded-r-full" />
                )}
                <link.icon
                    size={18}
                    className={`transition-colors duration-200 ${active ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-100'}`}
                />
                <span>{link.name}</span>
                {link.href === '/verificacion-pagos' && pendingCount > 0 && (
                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[9px] font-bold rounded-full ${hasNewOrders ? 'bg-red-500 animate-pulse' : 'bg-amber-500'} text-white`}>
                        {pendingCount > 99 ? '99+' : pendingCount}
                    </span>
                )}
            </Link>
        );
    };

    const SectionLabel = ({ children }: { children: React.ReactNode }) => (
        <div className="flex items-center gap-2 px-4 pt-3 pb-1">
            <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{children}</span>
            <div className="flex-1 h-px bg-white/5" />
        </div>
    );

    return (
        <aside
            className={`fixed z-50 transition-transform duration-300 ease-out
                inset-x-0 bottom-0 w-full
                lg:inset-y-0 lg:left-0 lg:bottom-auto lg:w-[260px] lg:static lg:h-screen
                ${isOpen ? 'translate-y-0' : 'translate-y-full'}
                lg:translate-y-0 lg:translate-x-0`}
        >
            <div className="h-full lg:p-3">
                <div className="flex flex-col bg-zinc-950 lg:bg-zinc-950/80 backdrop-blur-2xl border-t lg:border border-white/6 rounded-t-2xl lg:rounded-2xl lg:h-full lg:shadow-2xl lg:shadow-black/20 max-h-[85vh] lg:max-h-none overflow-hidden">
                    {/* Mobile Handle */}
                    <div className="lg:hidden pt-3 pb-1 flex justify-center shrink-0">
                        <div className="w-8 h-1 bg-white/15 rounded-full" />
                    </div>

                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-3 lg:py-4 shrink-0">
                        <Link href="/" className="flex items-center gap-2.5 group" onClick={onClose}>
                            <div className="relative w-8 h-8 lg:w-9 lg:h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden">
                                <Image
                                    src="https://ik.imagekit.io/xwym4oquc/resources/Isotipo(Invert).png"
                                    alt="Wingx Logo"
                                    width={28}
                                    height={28}
                                    className="w-7 h-7 object-contain"
                                />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-lg font-bold text-white tracking-tight leading-none">Wingx</span>
                                {role === 'admin' && (
                                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Admin</span>
                                )}
                            </div>
                        </Link>
                        <button
                            onClick={onClose}
                            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-2 overflow-y-auto pb-2 space-y-0.5">
                        <SectionLabel>Principal</SectionLabel>
                        {mainLinks.map(renderLink)}

                        <SectionLabel>Productos</SectionLabel>
                        {productLinks.map(renderLink)}

                        {(role === 'admin' || role === 'store') && (
                            <>
                                <SectionLabel>Tienda</SectionLabel>
                                {storeLinks.map(renderLink)}
                            </>
                        )}
                    </nav>

                    {/* Footer */}
                    <div className="px-3 pb-3 pt-2 border-t border-white/5 space-y-2 shrink-0">
                        {role === 'admin' && (
                            <Link
                                href={viewMode === 'user' ? '/' : '/?view=user'}
                                onClick={onClose}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-zinc-500 hover:bg-white/5 hover:text-white transition-all border border-dashed border-zinc-800 hover:border-zinc-600"
                            >
                                {viewMode === 'user' ? (
                                    <ShieldCheck size={14} className="text-zinc-500" />
                                ) : (
                                    <LayoutDashboard size={14} className="text-zinc-500" />
                                )}
                                <span>{viewMode === 'user' ? 'Volver a Admin' : 'Vista Usuario'}</span>
                            </Link>
                        )}

                        <div className="rounded-lg bg-black/30 border border-white/5 p-1 overflow-hidden">
                            <ExchangeRateWidget />
                        </div>

                        <button
                            onClick={logout}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium rounded-lg text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition-all cursor-pointer"
                        >
                            <LogOut size={14} />
                            <span>Cerrar Sesión</span>
                        </button>
                    </div>

                    {/* Safe area iOS */}
                    <div className="h-[env(safe-area-inset-bottom)] lg:hidden shrink-0" />
                </div>
            </div>
        </aside>
    );
}

