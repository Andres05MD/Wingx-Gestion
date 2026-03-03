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
        <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
            {/* Gradient fade para separar visualmente del contenido */}
            <div className="h-6 bg-linear-to-t from-black/80 to-transparent pointer-events-none" />

            <nav className="bg-zinc-950/95 backdrop-blur-2xl border-t border-white/6 px-2">
                <div className="flex items-center justify-around h-[60px]">
                    {links.map((link) => {
                        const active = isActive(link.href);
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="relative flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-90"
                            >
                                <div className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ${active ? 'bg-white/10' : ''}`}>
                                    <link.icon
                                        size={20}
                                        className={`transition-all duration-300 ${active ? 'text-white' : 'text-zinc-500'}`}
                                        strokeWidth={active ? 2.5 : 1.8}
                                    />
                                    {active && (
                                        <span className="absolute -bottom-1 w-4 h-0.5 bg-white rounded-full" />
                                    )}
                                </div>
                                <span className={`text-[9px] font-semibold mt-0.5 transition-all duration-300 ${active ? 'text-white' : 'text-zinc-600'}`}>
                                    {link.name}
                                </span>
                            </Link>
                        );
                    })}

                    {/* Botón Menú */}
                    <button
                        onClick={onOpenMenu}
                        className="relative flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-90 cursor-pointer"
                    >
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl transition-all">
                            <Menu size={20} strokeWidth={1.8} className="text-zinc-500" />
                        </div>
                        <span className="text-[9px] font-semibold mt-0.5 text-zinc-600">
                            Menú
                        </span>
                    </button>
                </div>

                {/* Safe Area para iOS */}
                <div className="h-[env(safe-area-inset-bottom)]" />
            </nav>
        </div>
    );
}
