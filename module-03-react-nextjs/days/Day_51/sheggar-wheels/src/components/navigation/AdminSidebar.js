'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '@/lib/useStore';
import {
  ShieldCheck,
  CheckSquare,
  Users,
  CalendarDays,
  AlertOctagon,
  BarChart3,
  Bell,
  Globe,
  LogOut,
} from 'lucide-react';

export default function AdminSidebar() {
  const pathname = usePathname();
  const { currentUser, signOut, cars, disputes } = useStore();

  const pendingCarsCount = cars.filter((c) => c.status === 'pending').length;
  const openDisputesCount = disputes.filter((d) => d.status === 'open').length;

  const navItems = [
    { label: 'Overview', href: '/admin', icon: ShieldCheck },
    {
      label: 'Listings Moderation',
      href: '/admin/listings',
      icon: CheckSquare,
      badge: pendingCarsCount > 0 ? pendingCarsCount : null,
    },
    { label: 'Users', href: '/admin/users', icon: Users },
    { label: 'All Bookings', href: '/admin/bookings', icon: CalendarDays },
    {
      label: 'Disputes',
      href: '/admin/disputes',
      icon: AlertOctagon,
      badge: openDisputesCount > 0 ? openDisputesCount : null,
      badgeColor: 'bg-rose-500',
    },
    { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
    { label: 'Announcements', href: '/admin/announcements', icon: Bell },
  ];

  return (
    <aside className="w-64 bg-slate-950 text-slate-200 border-r border-slate-800 min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 shrink-0">
      <div className="space-y-6">
        {/* Brand header */}
        <div className="px-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-white leading-tight">Sheggar Wheels</div>
              <div className="text-[10px] text-rose-400 font-semibold uppercase tracking-wider">
                Admin Control Panel
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-rose-900/60 text-white font-semibold border border-rose-700/50'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-rose-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white ${
                      item.badgeColor || 'bg-amber-500'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Public marketplace link */}
        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-slate-300 hover:text-white transition-colors"
          >
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>View Public Marketplace</span>
          </Link>
        </div>
      </div>

      {/* User profile & actions */}
      <div className="pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between px-2 py-1">
          <div className="truncate pr-2">
            <div className="text-xs font-bold text-white truncate">
              {currentUser?.name || 'Administrator'}
            </div>
            <div className="text-[10px] text-slate-400 truncate">{currentUser?.email}</div>
          </div>
          <button
            onClick={signOut}
            title="Sign out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg cursor-pointer transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
