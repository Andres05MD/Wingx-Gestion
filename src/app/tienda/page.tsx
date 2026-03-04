"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Trash, ShoppingBag, Shirt, Edit, Palette } from 'lucide-react';
import { getStoreProducts, deleteStoreProduct, StoreProduct } from '@/services/storage';
import { toast } from 'sonner';
import { useAuth } from "@/context/AuthContext";
import NuevoProductoModal from '@/components/NuevoProductoModal';

// Mapa de colores para visualización
const COLOR_MAP: Record<string, string> = {
    'Negro': '#000000',
    'Blanco': '#FFFFFF',
    'Rojo': '#EF4444',
    'Azul': '#3B82F6',
    'Azul Marino': '#1E3A5F',
    'Azul Cielo': '#87CEEB',
    'Verde': '#22C55E',
    'Verde Oliva': '#556B2F',
    'Amarillo': '#EAB308',
    'Naranja': '#F97316',
    'Rosa': '#EC4899',
    'Morado': '#A855F7',
    'Gris': '#6B7280',
    'Gris Claro': '#D1D5DB',
    'Marrón': '#92400E',
    'Beige': '#D4B896',
    'Crema': '#FFFDD0',
    'Coral': '#FF7F50',
    'Turquesa': '#40E0D0',
    'Lavanda': '#E6E6FA',
    'Borgoña': '#800020',
    'Terracota': '#E2725B',
    'Menta': '#98FF98',
    'Vino': '#722F37',
    'Caqui': '#C3B091'
};

export default function TiendaPage() {
    const { role, user, loading: authLoading } = useAuth();
    const [products, setProducts] = useState<StoreProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);

    // Verificar permisos de acceso
    const hasStoreAccess = role === 'admin' || role === 'store';

    useEffect(() => {
        if (!authLoading && user) {
            loadProducts();
        }
    }, [authLoading, user]);

    async function loadProducts() {
        setLoading(true);
        const data = await getStoreProducts();
        setProducts(data);
        setLoading(false);
    }

    async function handleDelete(id: string) {
        if (window.confirm("¿Eliminar producto?\n\nSe eliminará de la tienda pública. No podrás revertir esto.")) {
            try {
                await deleteStoreProduct(id);
                setProducts(products.filter(p => p.id !== id));
                toast.success('Producto retirado de la tienda.');
            } catch (error) {
                console.error(error);
                toast.error('No se pudo eliminar el producto.');
            }
        }
    }

    const filteredProducts = products.filter(p =>
        (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.categories || []).join(' ').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Si el usuario no tiene acceso a la tienda
    if (!authLoading && !hasStoreAccess) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/10 p-12 text-center max-w-md shadow-lg shadow-black/10">
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShoppingBag className="w-10 h-10 text-red-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">Acceso Restringido</h2>
                    <p className="text-zinc-400 leading-relaxed">
                        No tienes permisos para acceder a la gestión de la tienda virtual.
                        Contacta al administrador si necesitas acceso.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 md:space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2.5 md:gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-black/40">
                            <ShoppingBag className="w-5 h-5 md:w-6 md:h-6 text-black" />
                        </div>
                        Tienda Online
                    </h1>
                    <p className="text-zinc-400 text-sm mt-1 ml-13 hidden md:block">Gestión de productos visibles en la web</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="group bg-zinc-900 border border-zinc-800 hover:from-purple-400 hover:to-pink-400 text-white px-4 py-2.5 md:px-6 md:py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-black/40 hover:shadow-black/40 hover:scale-105 text-sm md:text-base cursor-pointer"
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                    <span>Nuevo Producto</span>
                </button>
            </div>

            {/* Search */}
            <div className="bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/10 p-3 md:p-4 shadow-lg shadow-black/10">
                <div className="relative max-w-xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o categoría..."
                        className="w-full pl-12 pr-4 py-2.5 md:py-3 rounded-xl bg-black/30 border border-white/10 focus:border-purple-500/50 focus:bg-black/40 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all text-white placeholder-zinc-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                {loading ? (
                    <div className="col-span-full p-12 text-center text-zinc-400">
                        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        Cargando productos...
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="col-span-full p-12 text-center">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShoppingBag className="w-8 h-8 text-zinc-600" />
                        </div>
                        <p className="text-zinc-400 font-medium text-lg">No hay productos en la tienda</p>
                    </div>
                ) : (
                    filteredProducts.map((product) => (
                        <div key={product.id} className="group relative bg-gradient-to-br from-white/[0.05] to-white/[0.01] backdrop-blur-md rounded-2xl border border-white/10 p-5 hover:border-purple-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1 flex flex-col h-full">
                            <div className="relative aspect-square w-full rounded-xl bg-black/20 mb-4 overflow-hidden border border-white/5">
                                {product.imageUrl ? (
                                    <img
                                        src={product.imageUrl}
                                        alt={product.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-zinc-600">
                                        <Shirt size={48} opacity={0.5} />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 flex gap-2">
                                    <Link
                                        href={`/tienda/${product.id}/editar`}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-black/50 hover:bg-blue-500/80 text-white backdrop-blur-sm transition-all"
                                    >
                                        <Edit size={14} />
                                    </Link>
                                    <button
                                        onClick={() => product.id && handleDelete(product.id)}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-black/50 hover:bg-red-500/80 text-white backdrop-blur-sm transition-all"
                                    >
                                        <Trash size={14} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-grow">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <h3 className="font-bold text-white text-lg leading-tight group-hover:text-zinc-100 transition-colors">
                                        {product.name}
                                    </h3>
                                </div>

                                <p className="text-zinc-400 text-sm mb-3 line-clamp-2 min-h-[2.5em]">
                                    {product.description}
                                </p>

                                <div className="flex flex-wrap gap-2 mb-4">
                                    {product.categories && product.categories.length > 0 ? (
                                        product.categories.map((cat, idx) => (
                                            <span key={idx} className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-medium text-zinc-300">
                                                {cat}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-medium text-zinc-300">
                                            General
                                        </span>
                                    )}
                                    <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-medium text-zinc-300">
                                        {product.sizes?.join(', ') || 'N/A'}
                                    </span>
                                </div>

                                {/* Colores disponibles */}
                                {product.colors && product.colors.length > 0 && (
                                    <div className="flex items-center gap-2 mb-3">
                                        <Palette className="w-3 h-3 text-zinc-500" />
                                        <div className="flex flex-wrap gap-1">
                                            {product.colors.slice(0, 6).map((color, idx) => {
                                                const combinedColorMap = { ...COLOR_MAP, ...(product.customColorMap || {}) };
                                                const isLight = ['Blanco', 'Crema', 'Beige', 'Amarillo', 'Gris Claro', 'Lavanda', 'Menta'].includes(color);
                                                return (
                                                    <div
                                                        key={idx}
                                                        title={color}
                                                        className={`w-4 h-4 rounded-full ${isLight ? 'border border-zinc-600' : ''}`}
                                                        style={{ backgroundColor: combinedColorMap[color] || '#888888' }}
                                                    />
                                                );
                                            })}
                                            {product.colors.length > 6 && (
                                                <span className="text-[10px] text-zinc-500 ml-1">+{product.colors.length - 6}</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t border-white/5 mt-auto flex items-center justify-between">
                                <span className="text-2xl font-bold text-white">
                                    ${product.price.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <NuevoProductoModal
                    onClose={() => setShowModal(false)}
                    onSuccess={() => {
                        setShowModal(false);
                        loadProducts();
                    }}
                />
            )}
        </div>
    );
}
