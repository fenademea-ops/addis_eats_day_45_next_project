'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/useStore';
import { formatETB } from '@/lib/format';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  Users,
  Car,
  CalendarCheck,
  TrendingUp,
  Percent,
  CheckSquare,
  AlertOctagon,
  ArrowRight,
  ShieldCheck,
  BarChart2,
} from 'lucide-react';

export default function AdminOverviewPage() {
  const { users, cars, bookings, disputes } = useStore();
  const [isClient, setIsClient] = useState(false);
  const [RechartsComponents, setRechartsComponents] = useState(null);

  useEffect(() => {
    setIsClient(true);
    import('recharts').then((recharts) => {
      setRechartsComponents({
        ResponsiveContainer: recharts.ResponsiveContainer,
        BarChart: recharts.BarChart,
        Bar: recharts.Bar,
        XAxis: recharts.XAxis,
        YAxis: recharts.YAxis,
        Tooltip: recharts.Tooltip,
        CartesianGrid: recharts.CartesianGrid,
      });
    });
  }, []);

  // KPIs
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === 'active').length;
  const suspendedUsers = users.filter((u) => u.status === 'suspended').length;

  const approvedCars = cars.filter((c) => c.status === 'approved').length;
  const pendingCars = cars.filter((c) => c.status === 'pending').length;

  const totalVolumeETB = useMemo(() => {
    return bookings
      .filter((b) => !['cancelled', 'declined'].includes(b.status))
      .reduce((sum, b) => sum + (b.total || 0), 0);
  }, [bookings]);

  const mockCommissionETB = useMemo(() => {
    return bookings
      .filter((b) => !['cancelled', 'declined'].includes(b.status))
      .reduce((sum, b) => sum + (b.fee || 0), 0);
  }, [bookings]);

  // Status breakdown data for charts
  const statusCounts = useMemo(() => {
    const counts = {};
    bookings.forEach((b) => {
      counts[b.status] = (counts[b.status] || 0) + 1;
    });

    return Object.entries(counts).map(([status, count]) => ({
      status: status.replace('_', ' '),
      count,
    }));
  }, [bookings]);

  const openDisputes = disputes.filter((d) => d.status === 'open');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Platform Master Console
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time analytics, trust & safety moderation, vehicle inspections, and fee volume.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/listings">
            <Button variant="primary" size="sm" className="bg-rose-600 hover:bg-rose-500">
              <CheckSquare className="w-4 h-4 mr-1.5" />
              Listing Queue ({pendingCars})
            </Button>
          </Link>
        </div>
      </div>

      {/* Pending Items Alerts (if any) */}
      {(pendingCars > 0 || openDisputes.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pendingCars > 0 && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <CheckSquare className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <strong className="text-white block font-bold">
                    {pendingCars} Vehicle Listing{pendingCars > 1 ? 's' : ''} Awaiting Review
                  </strong>
                  <span>Verify photos, owner identification, and daily pricing.</span>
                </div>
              </div>
              <Link href="/admin/listings">
                <Button variant="amber" size="sm" className="shrink-0 text-xs py-1 px-3">
                  Moderate
                </Button>
              </Link>
            </div>
          )}

          {openDisputes.length > 0 && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <strong className="text-white block font-bold">
                    {openDisputes.length} Open Trip Dispute{openDisputes.length > 1 ? 's' : ''}
                  </strong>
                  <span>Requires administrative review and policy resolution.</span>
                </div>
              </div>
              <Link href="/admin/disputes">
                <Button variant="danger" size="sm" className="shrink-0 text-xs py-1 px-3">
                  Resolve
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* KPIs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Total Users</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalUsers}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {activeUsers} active • {suspendedUsers} suspended
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Vehicles</span>
            <Car className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-white">{approvedCars}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {pendingCars} pending approval
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Bookings</span>
            <CalendarCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">{bookings.length}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">All recorded transitions</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Gross GMV (ETB)</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400">
            {formatETB(totalVolumeETB)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Total transacted volume</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Platform Fee (10%)</span>
            <Percent className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-400">
            {formatETB(mockCommissionETB)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Mock revenue earned</span>
        </div>
      </div>

      {/* Bookings Status Distribution Recharts Bar Chart */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-md">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-rose-400" />
            Bookings Distribution by Lifecycle State
          </h2>
          <span className="text-xs text-slate-400">Live Breakdown</span>
        </div>

        <div className="h-64 w-full pt-2">
          {isClient && RechartsComponents ? (
            <RechartsComponents.ResponsiveContainer width="100%" height="100%">
              <RechartsComponents.BarChart data={statusCounts}>
                <RechartsComponents.CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <RechartsComponents.XAxis dataKey="status" stroke="#94a3b8" fontSize={11} />
                <RechartsComponents.YAxis stroke="#94a3b8" fontSize={11} />
                <RechartsComponents.Tooltip
                  contentStyle={{
                    backgroundColor: '#020617',
                    borderColor: '#334155',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <RechartsComponents.Bar dataKey="count" fill="#e11d48" radius={[6, 6, 0, 0]} />
              </RechartsComponents.BarChart>
            </RechartsComponents.ResponsiveContainer>
          ) : (
            <div className="h-full w-full flex items-center justify-center text-xs text-slate-500">
              Loading distribution chart...
            </div>
          )}
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
        <Link
          href="/admin/users"
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-sm text-white group-hover:text-rose-400 transition-colors">
              User Governance
            </span>
            <Users className="w-4 h-4 text-slate-400 group-hover:text-rose-400" />
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Manage user accounts, assign roles, and suspend or reinstate policy-violating members.
          </p>
        </Link>

        <Link
          href="/admin/bookings"
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-sm text-white group-hover:text-rose-400 transition-colors">
              All Bookings Registry
            </span>
            <CalendarCheck className="w-4 h-4 text-slate-400 group-hover:text-rose-400" />
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Complete audit trail of every booking transition, pricing breakdown, and payment status.
          </p>
        </Link>

        <Link
          href="/admin/announcements"
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-sm text-white group-hover:text-rose-400 transition-colors">
              Broadcast Banners
            </span>
            <ShieldCheck className="w-4 h-4 text-slate-400 group-hover:text-rose-400" />
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Publish platform-wide announcements, maintenance notices, and promotional banners.
          </p>
        </Link>
      </div>
    </div>
  );
}
