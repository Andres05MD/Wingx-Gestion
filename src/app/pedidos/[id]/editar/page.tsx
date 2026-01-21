"use client";

import dynamic from 'next/dynamic';
import { useParams } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";

// ✨ Lazy loading para edición de pedidos
const OrderForm = dynamic(() => import("@/components/OrderForm"), {
    loading: () => <LoadingSpinner message="Cargando editor de pedido..." />,
    ssr: false
});

export default function EditOrderPage() {
    const params = useParams();
    const id = params.id as string;

    return (
        <div>
            <OrderForm id={id} />
        </div>
    );
}
