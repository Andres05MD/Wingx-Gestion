"use client";

import { useState, useRef } from "react";
import { saveStoreProduct, StoreProduct } from "@/services/storage";
import Swal from "sweetalert2";
import { X, Shirt, Tag, DollarSign, Image as ImageIcon, Ruler, ShoppingBag, Star, Palette, Plus, Upload, Camera, Loader2 } from "lucide-react";
import { FormInput, FormTextarea } from '@/components/ui';
import { IKContext, IKUpload } from 'imagekitio-react';

// Available colors with their hex values
const AVAILABLE_COLORS: { name: string; hex: string }[] = [
    { name: 'Negro', hex: '#000000' },
    { name: 'Blanco', hex: '#FFFFFF' },
    { name: 'Rojo', hex: '#EF4444' },
    { name: 'Azul', hex: '#3B82F6' },
    { name: 'Azul Marino', hex: '#1E3A5F' },
    { name: 'Azul Cielo', hex: '#87CEEB' },
    { name: 'Verde', hex: '#22C55E' },
    { name: 'Verde Oliva', hex: '#556B2F' },
    { name: 'Amarillo', hex: '#EAB308' },
    { name: 'Naranja', hex: '#F97316' },
    { name: 'Rosa', hex: '#EC4899' },
    { name: 'Morado', hex: '#A855F7' },
    { name: 'Gris', hex: '#6B7280' },
    { name: 'Gris Claro', hex: '#D1D5DB' },
    { name: 'Marrón', hex: '#92400E' },
    { name: 'Beige', hex: '#D4B896' },
    { name: 'Crema', hex: '#FFFDD0' },
    { name: 'Coral', hex: '#FF7F50' },
    { name: 'Turquesa', hex: '#40E0D0' },
    { name: 'Lavanda', hex: '#E6E6FA' },
    { name: 'Borgoña', hex: '#800020' },
    { name: 'Terracota', hex: '#E2725B' },
    { name: 'Menta', hex: '#98FF98' },
    { name: 'Vino', hex: '#722F37' },
    { name: 'Caqui', hex: '#C3B091' }
];

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

interface NuevoProductoModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function NuevoProductoModal({ onClose, onSuccess }: NuevoProductoModalProps) {
    const [loading, setLoading] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [categories, setCategories] = useState<string[]>([]);
    const [imageUrl, setImageUrl] = useState("");
    const [images, setImages] = useState<string[]>([]);
    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
    const [selectedColors, setSelectedColors] = useState<string[]>([]);
    const [customColorMap, setCustomColorMap] = useState<Record<string, string>>({});
    const [newColorName, setNewColorName] = useState('');
    const [newColorHex, setNewColorHex] = useState('#6366f1');
    const [gender, setGender] = useState<'Hombre' | 'Mujer' | 'Unisex'>('Unisex');
    const [featured, setFeatured] = useState(false);
    const [uploading, setUploading] = useState(false);
    const ikUploadRef = useRef<any>(null);

    const availableSizes = ["XS", "S", "M", "L", "XL", "XXL", "Unica"];

    const handleSizeToggle = (size: string) => {
        if (selectedSizes.includes(size)) {
            setSelectedSizes(selectedSizes.filter(s => s !== size));
        } else {
            setSelectedSizes([...selectedSizes, size]);
        }
    };

    const handleColorToggle = (color: string) => {
        if (selectedColors.includes(color)) {
            setSelectedColors(selectedColors.filter(c => c !== color));
        } else {
            setSelectedColors([...selectedColors, color]);
        }
    };

    const handleAddCustomColor = () => {
        const trimmedName = newColorName.trim();
        if (!trimmedName) return;

        const existsInPredefined = AVAILABLE_COLORS.some(c => c.name.toLowerCase() === trimmedName.toLowerCase());
        const existsInCustom = Object.keys(customColorMap).some(c => c.toLowerCase() === trimmedName.toLowerCase());

        if (existsInPredefined || existsInCustom) return;

        setCustomColorMap({ ...customColorMap, [trimmedName]: newColorHex });
        setSelectedColors([...selectedColors, trimmedName]);
        setNewColorName('');
        setNewColorHex('#6366f1');
    };

    const handleRemoveCustomColor = (colorName: string) => {
        const { [colorName]: _, ...rest } = customColorMap;
        setCustomColorMap(rest);
        setSelectedColors(selectedColors.filter(c => c !== colorName));
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
            colors: selectedColors,
            customColorMap: Object.keys(customColorMap).length > 0 ? customColorMap : undefined,
            gender,
            featured
        };

        try {
            await saveStoreProduct(productData);
            Swal.fire({
                toast: true, position: 'top-end', icon: 'success',
                title: 'Producto publicado en la tienda',
                showConfirmButton: false, timer: 2500,
                background: '#18181b', color: '#fff',
            });
            onSuccess();
        } catch (error) {
            console.error(error);
            Swal.fire("Error", "No se pudo guardar", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl shadow-black/40 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-zinc-950/95 backdrop-blur-xl border-b border-white/5 p-5 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center">
                            <ShoppingBag className="w-5 h-5 text-black" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Nuevo Producto</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
                        aria-label="Cerrar modal"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-5 space-y-5">
                    {/* Name */}
                    <FormInput
                        label="Nombre del Producto"
                        icon={<Shirt className="w-3 h-3" />}
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej. Camiseta Oversize Wingx..."
                    />

                    {/* Description */}
                    <FormTextarea
                        label="Descripción"
                        icon={<Tag className="w-3 h-3" />}
                        required
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Detalles sobre la tela, ajuste, etc..."
                    />

                    {/* Price & Gender */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormInput
                            label="Precio (USD)"
                            icon={<DollarSign className="w-3 h-3" />}
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="50.00"
                            className="font-mono"
                        />

                        {/* Gender */}
                        <div className="space-y-1.5">
                            <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                                Género / Sexo
                            </label>
                            <div className="flex gap-2">
                                {['Hombre', 'Mujer', 'Unisex'].map((g) => (
                                    <button
                                        key={g}
                                        type="button"
                                        onClick={() => setGender(g as any)}
                                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all border min-h-[44px] ${gender === g
                                            ? 'bg-white text-black border-white shadow-lg shadow-black/40'
                                            : 'bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10'
                                            }`}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="space-y-2">
                        <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                            <Tag className="w-3 h-3" />
                            Categoría y Subcategorías
                        </label>
                        <div className="bg-black/20 rounded-xl p-4 space-y-4 border border-white/5">
                            <div>
                                <p className="text-xs text-zinc-400 mb-2 font-medium">Categoría Principal</p>
                                <div className="flex flex-wrap gap-2">
                                    {Object.keys(PRODUCT_CATEGORIES).map(cat => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => {
                                                if (!categories.includes(cat)) {
                                                    setCategories([cat]);
                                                }
                                            }}
                                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${categories[0] === cat
                                                ? 'bg-white text-black border-white shadow-lg shadow-black/40'
                                                : 'bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10 hover:border-white/30'
                                                }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {categories.length > 0 && PRODUCT_CATEGORIES[categories[0]] && (
                                <div className="animate-in slide-in-from-top-2 duration-300">
                                    <p className="text-xs text-zinc-400 mb-2 font-medium flex items-center gap-2">
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
                                                    ? 'bg-zinc-300 text-black border-zinc-300'
                                                    : 'bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10'
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
                    <button
                        type="button"
                        onClick={() => setFeatured(!featured)}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all active:scale-[0.98] ${featured ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-white/5 border-white/10 hover:bg-white/8'}`}
                    >
                        <div className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center transition-colors ${featured ? 'bg-yellow-500/20' : 'bg-white/10'}`}>
                            <Star className={`w-4 h-4 transition-colors ${featured ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-500'}`} />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                            <p className={`text-sm font-bold leading-tight ${featured ? 'text-yellow-400' : 'text-zinc-300'}`}>
                                Destacar en el inicio
                            </p>
                            <p className="text-[10px] text-zinc-600 mt-0.5">Aparece en la sección principal de la tienda</p>
                        </div>
                        {/* Switch */}
                        <div className={`relative shrink-0 h-6 w-11 rounded-full transition-colors duration-200 ${featured ? 'bg-yellow-500' : 'bg-zinc-700'}`}>
                            <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${featured ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                    </button>

                    {/* Image Upload */}
                    <div className="space-y-2">
                        <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                            <ImageIcon className="w-3 h-3" />
                            Imágenes del Producto
                            {images.length > 0 && (
                                <span className="text-zinc-400 font-normal normal-case">({images.length}/5)</span>
                            )}
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
                            {/* Hidden IKUpload */}
                            <IKUpload
                                ref={ikUploadRef}
                                fileName={`product_${Date.now()}`}
                                folder="/catalogo"
                                onUploadStart={() => setUploading(true)}
                                onSuccess={(res: any) => {
                                    setUploading(false);
                                    const newImages = [...images, res.url];
                                    setImages(newImages);
                                    if (!imageUrl) setImageUrl(res.url);
                                    Swal.fire({
                                        toast: true, icon: 'success', title: 'Imagen agregada',
                                        position: 'top-end', showConfirmButton: false, timer: 2000,
                                        background: '#18181b', color: '#fff',
                                    });
                                }}
                                onError={(err: any) => {
                                    setUploading(false);
                                    console.error("Upload error", err);
                                    Swal.fire("Error", "No se pudo subir la imagen", "error");
                                }}
                                accept="image/*"
                                style={{ display: 'none' }}
                            />
                        </IKContext>

                        {/* Upload Zone */}
                        {images.length < 5 && (
                            <button
                                type="button"
                                onClick={() => ikUploadRef.current?.click()}
                                disabled={uploading}
                                className="w-full flex flex-col items-center justify-center gap-3 py-8 rounded-xl border-2 border-dashed border-white/15 bg-white/[0.02] hover:bg-white/5 hover:border-white/25 active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-wait min-h-[100px]"
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="w-8 h-8 text-white/60 animate-spin" />
                                        <span className="text-sm text-zinc-400 font-medium">Subiendo imagen...</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                                            <Camera className="w-6 h-6 text-zinc-400" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm text-zinc-300 font-medium">Toca para subir imagen</p>
                                            <p className="text-[10px] text-zinc-600 mt-0.5">JPG, PNG o WEBP</p>
                                        </div>
                                    </>
                                )}
                            </button>
                        )}

                        {/* Images Grid */}
                        {images.length > 0 && (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                {images.map((img, idx) => (
                                    <div key={idx} className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${imageUrl === img ? 'border-white shadow-lg shadow-black/40' : 'border-white/10'}`}>
                                        <img
                                            src={img}
                                            alt={`Product ${idx}`}
                                            className="w-full h-full object-cover cursor-pointer active:scale-95 transition-transform duration-200"
                                            onClick={() => setImageUrl(img)}
                                        />
                                        {imageUrl === img && (
                                            <div className="absolute top-1.5 left-1.5 bg-white text-black text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-sm pointer-events-none">
                                                PORTADA
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const newImages = images.filter(i => i !== img);
                                                setImages(newImages);
                                                if (imageUrl === img && newImages.length > 0) {
                                                    setImageUrl(newImages[0]);
                                                } else if (newImages.length === 0) {
                                                    setImageUrl("");
                                                }
                                            }}
                                            className="absolute top-1.5 right-1.5 w-7 h-7 flex items-center justify-center bg-black/60 hover:bg-red-500/80 text-white rounded-lg backdrop-blur-sm transition-all active:scale-90"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {images.length > 0 && (
                            <p className="text-[10px] text-zinc-600">Toca una imagen para establecerla como portada</p>
                        )}
                    </div>

                    {/* Sizes */}
                    <div className="space-y-2">
                        <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                            <Ruler className="w-3 h-3" />
                            Tallas Disponibles
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {availableSizes.map(size => (
                                <button
                                    key={size}
                                    type="button"
                                    onClick={() => handleSizeToggle(size)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border min-h-[44px] ${selectedSizes.includes(size)
                                        ? 'bg-white text-black border-white shadow-lg shadow-black/40'
                                        : 'bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10'
                                        }`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Colors */}
                    <div className="space-y-2">
                        <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                            <Palette className="w-3 h-3" />
                            Colores Disponibles
                            {selectedColors.length > 0 && (
                                <span className="text-xs text-zinc-100 font-normal normal-case">
                                    ({selectedColors.length} seleccionados)
                                </span>
                            )}
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {AVAILABLE_COLORS.map(color => {
                                const isLight = ['Blanco', 'Crema', 'Beige', 'Amarillo', 'Gris Claro', 'Lavanda', 'Menta'].includes(color.name);
                                return (
                                    <button
                                        key={color.name}
                                        type="button"
                                        title={color.name}
                                        onClick={() => handleColorToggle(color.name)}
                                        className={`relative w-9 h-9 rounded-full transition-all border-2 flex items-center justify-center ${selectedColors.includes(color.name)
                                            ? 'ring-2 ring-offset-2 ring-white ring-offset-zinc-900 scale-110'
                                            : 'hover:scale-110'
                                            } ${isLight ? 'border-zinc-600' : 'border-transparent'}`}
                                        style={{ backgroundColor: color.hex }}
                                    >
                                        {selectedColors.includes(color.name) && (
                                            <div className={`w-3.5 h-3.5 rounded-full ${isLight ? 'bg-black/60' : 'bg-white/80'}`} />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        {selectedColors.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {selectedColors.map(color => (
                                    <span key={color} className="text-xs bg-white/10 text-zinc-300 px-2 py-1 rounded-full">
                                        {color}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Custom Colors */}
                        <div className="mt-4 pt-4 border-t border-white/10">
                            <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-2 block">
                                Agregar Color Personalizado
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={newColorHex}
                                    onChange={(e) => setNewColorHex(e.target.value)}
                                    className="w-10 h-10 rounded-lg cursor-pointer border-2 border-white/20 hover:border-white/40 transition-colors shrink-0"
                                    title="Seleccionar color"
                                />
                                <input
                                    type="text"
                                    placeholder="Nombre del color..."
                                    value={newColorName}
                                    onChange={(e) => setNewColorName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomColor())}
                                    className="flex-1 px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddCustomColor}
                                    disabled={!newColorName.trim()}
                                    className="px-3 py-2.5 rounded-lg bg-white/10 border border-white/10 text-zinc-300 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 font-medium active:scale-95"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>

                            {Object.keys(customColorMap).length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {Object.entries(customColorMap).map(([colorName, colorHex]) => (
                                        <div
                                            key={colorName}
                                            className="flex items-center gap-2 bg-white/5 rounded-full pl-1 pr-2 py-1 border border-white/10"
                                        >
                                            <div
                                                className="w-6 h-6 rounded-full border border-white/20"
                                                style={{ backgroundColor: colorHex }}
                                            />
                                            <span className="text-xs text-zinc-300">{colorName}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveCustomColor(colorName)}
                                                className="text-zinc-400 hover:text-red-400 transition-colors"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl bg-white text-black font-bold text-sm hover:bg-zinc-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-black/40 cursor-pointer min-h-[44px]"
                    >
                        {loading ? 'Publicando...' : 'Publicar Producto'}
                    </button>
                </form>
            </div>
        </div>
    );
}
