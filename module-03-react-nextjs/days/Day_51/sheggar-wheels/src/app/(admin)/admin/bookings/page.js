'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/useStore';
import { formatETB, formatDate } from '@/lib/format';
import { generateCsv, downloadCsv } from '@/lib/csv';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import {
  CalendarDays,
  Search,
  Download,
  Eye,
  Filter,
} from 'lucide-react';

export default function AdminBookingsPage() {
  const { bookings, cars, users } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const car = cars.find((c) => c.id === b.carId);
      const renter = users.find((u) => u.id === b.renterId);
      const host = users.find((u) => u.id === b.ownerId);

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const text = `${b.id} ${car?.make} ${car?.model} ${renter?.name} ${host?.name} ${b.paymentRef}`.toLowerCase();
        if (!text.includes(q)) return false;
      }

      if (statusFilter !== 'all' && b.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [bookings, cars, users, searchQuery, statusFilter]);

  const handleExportCsv = () => {
    const rows = filteredBookings.map((b) => {
      const car = cars.find((c) => c.id === b.carId);
      const renter = users.find((u) => u.id === b.renterId);
      const host = users.find((u) => u.id === b.ownerId);

      return {
        bookingId: b.id,
        vehicle: car ? `${car.make} ${car.model}` : 'N/A',
        renter: renter?.name || 'Renter',
        host: host?.name || 'Host',
        startDate: b.startDate,
        endDate: b.endDate,
        days: b.days,
        subtotalETB: b.subtotal,
        feeETB: b.fee,
        totalETB: b.total,
        paymentStatus: b.paymentStatus,
        paymentRef: b.paymentRef || 'N/A',
        status: b.status,
        createdAt: b.createdAt,
      };
    });

    const headers = [
      { key: 'bookingId', label: 'Booking ID' },
      { key: 'vehicle', label: 'Vehicle' },
      { key: 'renter', label: 'Renter' },
      { key: 'host', label: 'Host' },
      { key: 'startDate', label: 'Start Date' },
      { key: 'endDate', label: 'End Date' },
      { key: 'days', label: 'Days' },
      { key: 'subtotalETB', label: 'Subtotal (ETB)' },
      { key: 'feeETB', label: 'Platform Fee (ETB)' },
      { key: 'totalETB', label: 'Total (ETB)' },
      { key: 'paymentStatus', label: 'Payment' },
      { key: 'paymentRef', label: 'Payment Ref' },
      { key: 'status', label: 'Lifecycle Status' },
      { key: 'createdAt', label: 'Timestamp' },
    ];

    const csv = generateCsv(rows, headers);
    downloadCsv(`sheggar-all-bookings-${Date.now()}.csv`, csv);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            All Platform Bookings ({bookings.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Complete audit trail across all reservation statuses and mock TeleBirr settlements.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={handleExportCsv} className="text-slate-300">
          <Download className="w-4 h-4 mr-1.5" />
          Export All Bookings CSV
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search booking ID, vehicle, renter, ref..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:ring-2 focus:ring-rose-500 min-h-[40px]"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3.5" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:ring-2 focus:ring-rose-500 min-h-[40px]"
          >
            <option value="all">All Statuses</option>
            <option value="requested">Requested</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="reviewed">Reviewed</option>
            <option value="cancelled">Cancelled</option>
            <option value="declined">Declined</option>
            <option value="disputed">Disputed</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Bookings Table */}
      {filteredBookings.length === 0 ? (
        <EmptyState
          title="No bookings match criteria"
          description="Try selecting a different status filter or clearing your search query."
          className="bg-slate-900 border-slate-800 text-slate-300"
        />
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Booking ID</th>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Renter & Host</th>
                  <th className="py-3 px-4">Dates</th>
                  <th className="py-3 px-4 text-right">Fee (10%)</th>
                  <th className="py-3 px-4 text-right">Total (ETB)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {filteredBookings.map((b) => {
                  const car = cars.find((c) => c.id === b.carId);
                  const renter = users.find((u) => u.id === b.renterId);
                  const host = users.find((u) => u.id === b.ownerId);

                  return (
                    <tr key={b.id} className="hover:bg-slate-850 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-white">{b.id}</td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">
                          {car?.make} {car?.model}
                        </div>
                        <div className="text-[11px] text-slate-400">{car?.neighbourhood}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-white">
                          Renter: <strong>{renter?.name || 'Renter'}</strong>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Host: {host?.name || 'Host'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">
                        {formatDate(b.startDate)} → {formatDate(b.endDate)}
                        <span className="text-[11px] text-slate-500 block">({b.days} days)</span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-semibold text-amber-400">
                        {formatETB(b.fee)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-extrabold text-white">
                        {formatETB(b.total)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={b.status} type="booking" />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Link href={`/bookings/${b.id}`} target="_blank">
                          <button
                            title="View Full Booking Receipt"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
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
