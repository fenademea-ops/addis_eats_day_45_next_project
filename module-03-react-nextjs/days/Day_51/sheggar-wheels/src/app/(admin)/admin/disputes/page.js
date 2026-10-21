'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/useStore';
import { formatDate } from '@/lib/format';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { AlertOctagon, CheckCircle2, Eye, ShieldCheck, ArrowRight } from 'lucide-react';

export default function AdminDisputesPage() {
  const { disputes, bookings, cars, users } = useStore();

  const openCount = disputes.filter((d) => d.status === 'open').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Trust & Safety Dispute Queue ({disputes.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Investigate customer claims, fuel disputes, and damage reports. Admin resolutions are
            recorded immutably.
          </p>
        </div>

        {openCount > 0 && (
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
            {openCount} Case{openCount > 1 ? 's' : ''} Require Resolution
          </span>
        )}
      </div>

      {disputes.length === 0 ? (
        <EmptyState
          title="No disputes on file"
          description="The platform currently has zero open or past customer claims."
          className="bg-slate-900 border-slate-800 text-slate-300"
        />
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Dispute ID</th>
                  <th className="py-3 px-4">Claim Reason</th>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Opened By</th>
                  <th className="py-3 px-4">Date Filed</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {disputes.map((d) => {
                  const booking = bookings.find((b) => b.id === d.bookingId);
                  const car = booking ? cars.find((c) => c.id === booking.carId) : null;
                  const opener = users.find((u) => u.id === d.openedBy);

                  return (
                    <tr key={d.id} className="hover:bg-slate-850 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-white">{d.id}</td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-white block">{d.reason}</span>
                        <span className="text-[11px] text-slate-400 line-clamp-1">
                          {d.description}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-200">
                          {car?.make} {car?.model}
                        </div>
                        <div className="text-[11px] text-slate-400">{car?.neighbourhood}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-white font-medium">{opener?.name || 'User'}</div>
                        <div className="text-[11px] text-slate-400">{opener?.email}</div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400">{formatDate(d.createdAt)}</td>

                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={d.status} type="dispute" />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Link href={`/admin/disputes/${d.id}`}>
                          <Button
                            variant={d.status === 'open' ? 'danger' : 'outline'}
                            size="sm"
                            className="text-xs py-1 px-3"
                          >
                            {d.status === 'open' ? 'Review & Resolve' : 'View Finding'}
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
