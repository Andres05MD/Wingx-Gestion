"use client";

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useOrders } from '@/context/OrdersContext';
import { useGarments } from '@/context/GarmentsContext';

import QuickActions from '@/components/dashboard/QuickActions';
import StatsGrid from '@/components/dashboard/StatsGrid';
import OrdersList from '@/components/dashboard/OrdersList';

// Lazy load AdminDashboard
const AdminDashboard = dynamic(() => import('@/components/AdminDashboard'), {
  loading: () => <div className="p-8 text-slate-400">Cargando panel...</div>
});

export default function Dashboard() {
  const { role } = useAuth();
  const searchParams = useSearchParams();
  const viewMode = searchParams.get('view');

  // ✨ Usando contextos globales - sin queries redundantes
  const { orders, loading: ordersLoading } = useOrders();
  const { garments } = useGarments();

  const loading = ordersLoading;

  // Memoized Calculations
  const { realIncome, pendingPayments, activeOrders, estimatedProfit } = useMemo(() => {
    const realIncome = orders.reduce((sum, o) => sum + (Number(o.paidAmount) || 0), 0);

    const pendingPayments = orders.reduce((sum, o) => {
      const balance = (Number(o.price) || 0) - (Number(o.paidAmount) || 0);
      return sum + (balance > 0 ? balance : 0);
    }, 0);

    const activeOrders = orders.filter(o => o.status !== 'Finalizado' && o.status !== 'Entregado').length;

    const estimatedProfit = orders.reduce((sum, order) => {
      const revenue = Number(order.price) || 0;
      let cost = 0;
      if (order.garmentId) {
        const garment = garments.find(g => g.id === order.garmentId);
        if (garment) {
          const labor = Number(garment.laborCost) || 0;
          const transport = Number(garment.transportCost) || 0;
          const materials = garment.materials?.reduce((mSum, m) => mSum + (Number(m.cost) || 0), 0) || 0;
          cost = labor + transport + materials;
        }
      }
      return sum + (revenue - cost);
    }, 0);

    return { realIncome, pendingPayments, activeOrders, estimatedProfit };
  }, [orders, garments]);

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 10);
  }, [orders]);

  if (role === 'admin' && viewMode !== 'user') {
    return <AdminDashboard />;
  }

  return (
    <div className="space-y-8">
      {/* Quick Actions */}
      <QuickActions />

      {/* Stats Grid */}
      <StatsGrid
        loading={loading}
        realIncome={realIncome}
        pendingPayments={pendingPayments}
        activeOrders={activeOrders}
        estimatedProfit={estimatedProfit}
      />

      {/* Orders List */}
      <OrdersList
        loading={loading}
        orders={recentOrders}
      />

      {/* Footer */}
      <footer className="pt-8 pb-4 text-center text-slate-400 text-sm">
        <p>CEO: Valeria Petaccia</p>
      </footer>
    </div>
  );
}
