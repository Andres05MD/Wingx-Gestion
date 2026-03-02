"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getDashboardStats, getRecentOrders, DashboardStats, Order } from '@/services/storage';

import QuickActions from '@/components/dashboard/QuickActions';
import StatsGrid from '@/components/dashboard/StatsGrid';
import OrdersList from '@/components/dashboard/OrdersList';

// Lazy load AdminDashboard
const AdminDashboard = dynamic(() => import('@/components/AdminDashboard'), {
  loading: () => <div className="p-8 text-zinc-400">Cargando panel...</div>
});

export default function Dashboard() {
  const { role, user } = useAuth();
  const searchParams = useSearchParams();
  const viewMode = searchParams.get('view');

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // ✨ Cargar stats con Aggregation Queries (sin descargar todos los documentos)
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadDashboard = async () => {
      setLoading(true);
      try {
        const [dashStats, orders] = await Promise.all([
          getDashboardStats(role || undefined, user.uid),
          getRecentOrders(role || undefined, user.uid, 10),
        ]);

        if (!cancelled) {
          setStats(dashStats);
          setRecentOrders(orders);
        }
      } catch (err) {
        console.error("Error loading dashboard:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadDashboard();
    return () => { cancelled = true; };
  }, [user?.uid, role]);

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
        realIncome={stats?.totalIncome ?? 0}
        pendingPayments={stats?.totalPending ?? 0}
        activeOrders={stats?.activeOrdersCount ?? 0}
        estimatedProfit={stats?.totalIncome ?? 0}
      />

      {/* Orders List */}
      <OrdersList
        loading={loading}
        orders={recentOrders}
      />

      {/* Footer */}
      <footer className="pt-8 pb-4 text-center text-zinc-400 text-sm">
        <p>CEO: Valeria Petaccia</p>
      </footer>
    </div>
  );
}
