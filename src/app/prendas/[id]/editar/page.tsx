"use client";

import dynamic from 'next/dynamic';
import { useParams } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";

// ✨ Lazy loading para edición
const GarmentForm = dynamic(() => import("@/components/GarmentForm"), {
    loading: () => <LoadingSpinner message="Cargando editor de prenda..." />,
    ssr: false
});

export default function EditGarmentPage() {
    const params = useParams();
    const id = params.id as string;

    return (
        <div>
            <GarmentForm id={id} />
        </div>
    );
}
