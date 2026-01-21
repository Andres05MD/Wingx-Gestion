"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClipboardList, Calendar, Package, Users, Menu } from 'lucide-react';

interface MobileBottomNavProps {
    onOpenMenu: () => void;
}

export default function MobileBottomNav({ onOpenMenu }: MobileBottomNavProps) {
    const pathname = usePathname();

    const links = [
        { name: 'Pedidos', href: '/pedidos', icon: ClipboardList },
        { name: 'Agenda', href: '/agenda', icon: Calendar },
        { name: 'Stock', href: '/inventario', icon: Package },
        { name: 'Clientes', href: '/clientes', icon: Users },
    ];

    const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0f172a]/95 backdrop-blur-xl border-t border-white/10 lg:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.3)] safe-pb">
            <nav className="flex items-center justify-around h-[60px]">
                {links.map((link) => {
                    const active = isActive(link.href);
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`group flex flex-col items-center justify-center w-full h-full gap-0.5 transition-all active:scale-90 ${active ? 'text-blue-400' : 'text-slate-500'
                                }`}
                        >
                            <div className={`relative p-1.5 rounded-2xl transition-all duration-300 ${active ? 'bg-blue-500/10 -translate-y-1' : 'group-hover:bg-white/5'}`}>
                                <link.icon
                                    size={22}
                                    className={`transition-all duration-300 ${active ? 'fill-blue-500/20 stroke-blue-400' : ''}`}
                                    strokeWidth={active ? 2.5 : 2}
                                />
                                {active && (
                                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400 shadow-lg shadow-blue-400/50"></span>
                                )}
                            </div>
                            <span className={`text-[10px] font-bold transition-all duration-300 ${active ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                                {link.name}
                            </span>
                        </Link>
                    );
                })}

                {/* Botón Menú */}
                <button
                    onClick={onOpenMenu}
                    className="group flex flex-col items-center justify-center w-full h-full gap-0.5 text-slate-500 transition-all active:scale-90"
                >
                    <div className="relative p-1.5 rounded-2xl transition-all duration-300 group-hover:bg-white/5">
                        <Menu size={22} strokeWidth={2} />
                    </div>
                    <span className="text-[10px] font-bold group-hover:text-slate-300">
                        Menú
                    </span>
                </button>
            </nav>
            {/* Safe Area para iOS */}
            <div className="h-[env(safe-area-inset-bottom)] bg-transparent"></div>
        </div>
    );
}
