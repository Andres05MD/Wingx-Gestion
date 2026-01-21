"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveStoreProduct, StoreProduct } from "@/services/storage";
import Swal from "sweetalert2";
import { ArrowLeft, Save, Shirt, Tag, DollarSign, Image as ImageIcon, Ruler, ShoppingBag, Star } from "lucide-react";
import Link from "next/link";
import { IKContext, IKUpload } from 'imagekitio-react';

export default function NewProductPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [categories, setCategories] = useState<string[]>([]);
    const [imageUrl, setImageUrl] = useState("");
    const [images, setImages] = useState<string[]>([]);
    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
    const [gender, setGender] = useState<'Hombre' | 'Mujer' | 'Unisex'>('Unisex');
    const [featured, setFeatured] = useState(false);

    const availableSizes = ["XS", "S", "M", "L", "XL", "XXL", "Unica"];

    const PRODUCT_CATEGORIES: Record<string, string[]> = {
        "Camisas": ["Franela", "Casual", "Formal", "Manga Larga", "Manga Corta", "Oversize", "Blusa"],
        "Pantalones": ["Vestir", "Mono", "Joggers", "Jeans", "Cargo", "Shorts", "Leggins"],
        "Conjuntos": ["Deportivo", "Casual", "Formal", "Verano", "Invierno"],
        "Trajes de baño": ["Enterizo", "Bikini", "Short"],
        "Abrigos": ["Poleron", "Chaqueta", "Sueter", "Chaleco", "Cortavientos", "Cardigan"],
        "Vestidos": ["Largo", "Corto", "Fiesta", "Casual"],
        "Accesorios": ["Gorras", "Medias", "Bolsos", "Lentes", "Joyeria", "Cinturones"],

        "Lenceria": ["Conjuntos", "Individuales", "Pijamas", "Batas"],
        "Otros": ["Varios"]
    };

    const handleSizeToggle = (size: string) => {
        if (selectedSizes.includes(size)) {
            setSelectedSizes(selectedSizes.filter(s => s !== size));
        } else {
            setSelectedSizes([...selectedSizes, size]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const productData: StoreProduct = {
            name,
            description,
            price: Number(price),
            categories,
            imageUrl,
            images,
            sizes: selectedSizes,
            gender,
            featured
        };

        try {
            await saveStoreProduct(productData);
            Swal.fire("¡Éxito!", "Producto publicado en la tienda", "success");
            router.push("/tienda");
        } catch (error) {
            console.error(error);
            Swal.fire("Error", "No se pudo guardar", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/tienda"
                            className="group flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-black text-white flex items-center gap-3">
                                <ShoppingBag className="w-8 h-8 text-purple-400" />
                                Nuevo Producto
                            </h1>
                            <p className="text-slate-400 mt-1">Publicar prenda en la tienda online</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Main Info Card */}
                    <div className="bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl shadow-black/20">
                        <div className="space-y-6">

                            {/* Name */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                                    <Shirt className="w-4 h-4 text-blue-400" />
                                    Nombre del Producto
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ej. Camiseta Oversize Wingx..."
                                    className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 focus:border-purple-500/50 focus:bg-black/40 outline-none transition-all text-white placeholder-slate-500"
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                                    <Tag className="w-4 h-4 text-emerald-400" />
                                    Descripción
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Detalles sobre la tela, ajuste, etc..."
                                    className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 focus:border-purple-500/50 focus:bg-black/40 outline-none transition-all text-white placeholder-slate-500 resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Price */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                                        <DollarSign className="w-4 h-4 text-amber-400" />
                                        Precio (USD)
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        placeholder="50.00"
                                        className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 focus:border-purple-500/50 focus:bg-black/40 outline-none transition-all text-white placeholder-slate-500 font-mono"
                                    />
                                </div>

                                {/* Gender Selection */}
                                <div className="space-y-4">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                                        Genero / Sexo
                                    </label>
                                    <div className="flex gap-2">
                                        {['Hombre', 'Mujer', 'Unisex'].map((g) => (
                                            <button
                                                key={g}
                                                type="button"
                                                onClick={() => setGender(g as any)}
                                                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all border ${gender === g
                                                    ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20'
                                                    : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                                                    }`}
                                            >
                                                {g}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Categories (Structured) */}
                                <div className="space-y-4 md:col-span-2">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                                        <Tag className="w-4 h-4 text-pink-400" />
                                        Categoría y Subcategorías
                                    </label>

                                    <div className="bg-black/20 rounded-xl p-4 space-y-4 border border-white/5">
                                        {/* Main Category */}
                                        <div>
                                            <p className="text-xs text-slate-400 mb-2 font-medium">Categoría Principal</p>
                                            <div className="flex flex-wrap gap-2">
                                                {Object.keys(PRODUCT_CATEGORIES).map(cat => (
                                                    <button
                                                        key={cat}
                                                        type="button"
                                                        onClick={() => {
                                                            // Set main category, keep existing subcategories if valid? 
                                                            // Better to reset subcategories if main changes to avoid confusion
                                                            if (!categories.includes(cat)) {
                                                                // If switching main category, clear list and start with new main
                                                                setCategories([cat]);
                                                            }
                                                        }}
                                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${categories[0] === cat
                                                            ? 'bg-pink-500 text-white border-pink-500 shadow-lg shadow-pink-500/20'
                                                            : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:border-white/30'
                                                            }`}
                                                    >
                                                        {cat}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Subcategories */}
                                        {categories.length > 0 && PRODUCT_CATEGORIES[categories[0]] && (
                                            <div className="animate-in slide-in-from-top-2 duration-300">
                                                <p className="text-xs text-slate-400 mb-2 font-medium flex items-center gap-2">
                                                    Subcategorías de <span className="text-white font-bold">{categories[0]}</span>
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {PRODUCT_CATEGORIES[categories[0]].map(sub => (
                                                        <button
                                                            key={sub}
                                                            type="button"
                                                            onClick={() => {
                                                                if (categories.includes(sub)) {
                                                                    setCategories(categories.filter(c => c !== sub));
                                                                } else {
                                                                    setCategories([...categories, sub]);
                                                                }
                                                            }}
                                                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${categories.includes(sub)
                                                                ? 'bg-purple-500/50 text-white border-purple-500/50'
                                                                : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                                                                }`}
                                                        >
                                                            {sub}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {categories.length === 0 && (
                                        <p className="text-xs text-red-400 mt-1">* Selecciona una categoría principal</p>
                                    )}
                                </div>

                                {/* Featured Toggle */}
                                <div className="space-y-2 md:col-span-2">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 uppercase tracking-wider cursor-pointer select-none">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                checked={featured}
                                                onChange={(e) => setFeatured(e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-slate-700/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Star className={`w-4 h-4 ${featured ? 'fill-yellow-500 text-yellow-500' : 'text-slate-500'}`} />
                                            <span className={featured ? 'text-yellow-400 font-bold' : 'text-slate-400'}>
                                                Destacar Producto en el Inicio
                                            </span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Image Upload */}
                            <div className="space-y-4">
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                                    <ImageIcon className="w-4 h-4 text-cyan-400" />
                                    Imágenes del Producto (Máx 5)
                                </label>

                                <IKContext
                                    publicKey={process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY}
                                    urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}
                                    authenticator={async () => {
                                        const response = await fetch("/api/auth/imagekit");
                                        if (!response.ok) throw new Error("Failed to auth imagekit");
                                        return response.json();
                                    }}
                                >
                                    <div className="flex flex-col gap-4">
                                        <IKUpload
                                            fileName={`product_${Date.now()}`}
                                            folder="/catalogo"
                                            onSuccess={(res: any) => {
                                                console.log("Upload success", res);
                                                const newImages = [...images, res.url];
                                                setImages(newImages);
                                                // Set first image as main automatically if none set
                                                if (!imageUrl) setImageUrl(res.url);

                                                Swal.fire({
                                                    toast: true,
                                                    icon: 'success',
                                                    title: 'Imagen agregada',
                                                    position: 'top-end',
                                                    showConfirmButton: false,
                                                    timer: 2000
                                                });
                                            }}
                                            onError={(err: any) => {
                                                console.error("Upload error", err);
                                                Swal.fire("Error", "No se pudo subir la imagen", "error");
                                            }}
                                            className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-500/10 file:text-purple-400 hover:file:bg-purple-500/20 transition-all cursor-pointer"
                                        />

                                        <p className="text-xs text-slate-500">
                                            La primera imagen será la portada. Haz clic en una imagen para establecerla como portada.
                                        </p>
                                    </div>
                                </IKContext>

                                {/* Images Grid */}
                                {images.length > 0 && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                        {images.map((img, idx) => (
                                            <div key={idx} className={`relative group aspect-square rounded-xl overflow-hidden border-2 transition-all ${imageUrl === img ? 'border-purple-500 shadow-lg shadow-purple-500/20' : 'border-white/10'}`}>
                                                <img
                                                    src={img}
                                                    alt={`Product ${idx}`}
                                                    className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform duration-500"
                                                    onClick={() => setImageUrl(img)}
                                                />
                                                {imageUrl === img && (
                                                    <div className="absolute top-2 left-2 bg-purple-500 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm pointer-events-none">
                                                        PORTADA
                                                    </div>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newImages = images.filter(i => i !== img);
                                                        setImages(newImages);
                                                        if (imageUrl === img && newImages.length > 0) {
                                                            setImageUrl(newImages[0]);
                                                        } else if (newImages.length === 0) {
                                                            setImageUrl("");
                                                        }
                                                    }}
                                                    className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-600 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                                                >
                                                    <ArrowLeft className="w-3 h-3 rotate-45" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Sizes */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                                    <Ruler className="w-4 h-4 text-indigo-400" />
                                    Tallas Disponibles
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {availableSizes.map(size => (
                                        <button
                                            key={size}
                                            type="button"
                                            onClick={() => handleSizeToggle(size)}
                                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border ${selectedSizes.includes(size)
                                                ? 'bg-purple-500 text-white border-purple-500 shadow-lg shadow-purple-500/20'
                                                : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                                                }`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between gap-4 pt-4">
                        <Link
                            href="/tienda"
                            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-semibold transition-all text-sm"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group px-8 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-slate-600 disabled:to-slate-600 text-white font-bold transition-all duration-300 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 disabled:shadow-none flex items-center gap-2 text-sm"
                        >
                            <Save className="w-4 h-4" />
                            {loading ? "Publicando..." : "Publicar Producto"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
