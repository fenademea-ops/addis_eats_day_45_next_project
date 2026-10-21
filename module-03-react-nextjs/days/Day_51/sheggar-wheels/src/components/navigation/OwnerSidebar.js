'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '@/lib/useStore';
import {
  LayoutDashboard,
  Car,
  PlusCircle,
  TrendingUp,
  MessageSquare,
  AlertTriangle,
  ArrowRightLeft,
  LogOut,
} from 'lucide-react';

export default function OwnerSidebar() {
  const pathname = usePathname();
  const { currentUser, signOut } = useStore();

  const navItems = [
    { label: 'Overview', href: '/owner', icon: LayoutDashboard },
    { label: 'My Fleet', href: '/owner/cars', icon: Car },
    { label: 'Add Car', href: '/owner/cars/new', icon: PlusCircle },
    { label: 'Earnings', href: '/owner/earnings', icon: TrendingUp },
    { label: 'Reviews', href: '/owner/reviews', icon: MessageSquare },
    { label: 'Disputes', href: '/owner/disputes', icon: AlertTriangle },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 border-r border-slate-800 min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 shrink-0">
      <div className="space-y-6">
        {/* Brand header */}
        <div className="px-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-bold">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-sm text-white leading-tight">Sheggar Wheels</div>
              <div className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">
                Host Console
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/owner'
                ? pathname === '/owner'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Mode switcher link */}
        <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
          <div className="text-xs font-semibold text-slate-300 mb-1">Renter Mode</div>
          <p className="text-[11px] text-slate-400 mb-2.5">
            Looking to rent a vehicle for yourself in Addis?
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Go to Renter Dashboard
          </Link>
        </div>
      </div>

      {/* User profile & actions */}
      <div className="pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between px-2 py-1">
          <div className="truncate pr-2">
            <div className="text-xs font-bold text-white truncate">
              {currentUser?.name || 'Car Owner'}
            </div>
            <div className="text-[10px] text-slate-400 truncate">{currentUser?.email}</div>
          </div>
          <button
            onClick={signOut}
            title="Sign out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
