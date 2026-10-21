'use client';

import { useMemo } from 'react';
import { useStore } from '@/lib/useStore';
import { formatETB } from '@/lib/format';
import { generateCsv, downloadCsv } from '@/lib/csv';
import Button from '@/components/ui/Button';
import { Download, BarChart3, TrendingUp, MapPin, DollarSign, PieChart } from 'lucide-react';

export default function AdminReportsPage() {
  const { bookings, cars, users } = useStore();

  const completedBookings = useMemo(() => {
    return bookings.filter((b) =>
      ['confirmed', 'in_progress', 'completed', 'reviewed'].includes(b.status)
    );
  }, [bookings]);

  const grossVolume = completedBookings.reduce((sum, b) => sum + (b.total || 0), 0);
  const platformRevenue = completedBookings.reduce((sum, b) => sum + (b.fee || 0), 0);
  const hostPayouts = completedBookings.reduce((sum, b) => sum + (b.subtotal || 0), 0);

  // Neighbourhood breakdown
  const neighbourhoodStats = useMemo(() => {
    const map = {};
    completedBookings.forEach((b) => {
      const car = cars.find((c) => c.id === b.carId);
      const nh = car?.neighbourhood || 'Other';
      if (!map[nh]) {
        map[nh] = { neighbourhood: nh, bookingsCount: 0, daysCount: 0, volumeETB: 0 };
      }
      map[nh].bookingsCount += 1;
      map[nh].daysCount += b.days || 1;
      map[nh].volumeETB += b.total || 0;
    });

    return Object.values(map).sort((a, b) => b.volumeETB - a.volumeETB);
  }, [completedBookings, cars]);

  const handleExportFullReport = () => {
    const rows = completedBookings.map((b) => {
      const car = cars.find((c) => c.id === b.carId);
      const renter = users.find((u) => u.id === b.renterId);
      const host = users.find((u) => u.id === b.ownerId);

      return {
        bookingId: b.id,
        vehicle: car ? `${car.make} ${car.model}` : 'N/A',
        district: car?.neighbourhood || 'Addis Ababa',
        renterName: renter?.name || 'Renter',
        hostName: host?.name || 'Host',
        startDate: b.startDate,
        endDate: b.endDate,
        rentalDays: b.days,
        subtotalETB: b.subtotal,
        feeETB: b.fee,
        totalVolumeETB: b.total,
        paymentRef: b.paymentRef || 'N/A',
        status: b.status,
      };
    });

    const headers = [
      { key: 'bookingId', label: 'Booking Ref' },
      { key: 'vehicle', label: 'Car Model' },
      { key: 'district', label: 'District' },
      { key: 'renterName', label: 'Renter' },
      { key: 'hostName', label: 'Host' },
      { key: 'startDate', label: 'Start Date' },
      { key: 'endDate', label: 'End Date' },
      { key: 'rentalDays', label: 'Days' },
      { key: 'subtotalETB', label: 'Host Net (ETB)' },
      { key: 'feeETB', label: 'Commission 10% (ETB)' },
      { key: 'totalVolumeETB', label: 'Gross Volume (ETB)' },
      { key: 'paymentRef', label: 'TeleBirr Ref' },
      { key: 'status', label: 'Status' },
    ];

    const csv = generateCsv(rows, headers);
    downloadCsv(`sheggar-admin-financial-report-${Date.now()}.csv`, csv);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Financial & Volume Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Audit platform turnover, mock commission fees, and neighbourhood activity across Addis
            Ababa.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleExportFullReport}
          className="bg-rose-600 hover:bg-rose-500 font-bold"
        >
          <Download className="w-4 h-4 mr-1.5" />
          Download Financial Audit CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">Gross GMV</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{formatETB(grossVolume)}</div>
          <span className="text-[11px] text-slate-500 block">Total paid reservations</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">Platform Revenue (10%)</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{formatETB(platformRevenue)}</div>
          <span className="text-[11px] text-slate-500 block">Mock service fee earned</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">Host Payouts (90%)</span>
            <DollarSign className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-white">{formatETB(hostPayouts)}</div>
          <span className="text-[11px] text-slate-500 block">Net remitted to car hosts</span>
        </div>
      </div>

      {/* District Volume Breakdown */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-400" />
          Turnover by Addis Ababa District
        </h2>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Neighbourhood</th>
                  <th className="py-3 px-4 text-center">Completed Bookings</th>
                  <th className="py-3 px-4 text-center">Rental Days</th>
                  <th className="py-3 px-4 text-right">Volume (ETB)</th>
                  <th className="py-3 px-4 text-right">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {neighbourhoodStats.map((st) => {
                  const share =
                    grossVolume > 0 ? Math.round((st.volumeETB / grossVolume) * 100) : 0;
                  return (
                    <tr key={st.neighbourhood} className="hover:bg-slate-850 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                        {st.neighbourhood}
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium">{st.bookingsCount}</td>
                      <td className="py-3.5 px-4 text-center font-medium">{st.daysCount}</td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-emerald-400 text-sm">
                        {formatETB(st.volumeETB)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-400">
                        {share}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
