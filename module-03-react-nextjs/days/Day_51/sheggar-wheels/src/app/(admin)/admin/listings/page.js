'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/useStore';
import { formatETB, formatDate } from '@/lib/format';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import CarImageFallback from '@/components/ui/CarImageFallback';
import Modal from '@/components/ui/Modal';
import {
  CheckSquare,
  Check,
  X,
  Eye,
  MapPin,
  Calendar,
  AlertCircle,
  Filter,
} from 'lucide-react';

export default function AdminListingsPage() {
  const { cars, users, moderateCar, showToast } = useStore();

  const [filterStatus, setFilterStatus] = useState('all');
  const [rejectModalCar, setRejectModalCar] = useState(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const filteredCars = useMemo(() => {
    if (filterStatus === 'all') return cars;
    return cars.filter((c) => c.status === filterStatus);
  }, [cars, filterStatus]);

  const handleApprove = (carId) => {
    const res = moderateCar(carId, 'approved', 'Verified and approved by admin.');
    if (res.success) {
      showToast('Listing approved and now public on the marketplace!', 'success');
    }
  };

  const handleConfirmReject = () => {
    if (!rejectModalCar) return;
    setLoading(true);

    const res = moderateCar(
      rejectModalCar.id,
      'rejected',
      rejectNotes || 'Does not meet marketplace standards'
    );

    setLoading(false);
    if (res.success) {
      setRejectModalCar(null);
      setRejectNotes('');
      showToast('Listing rejected', 'info');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Vehicle Listings Moderation
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Review incoming host submissions, enforce photo authenticity, and set public listing
            states.
          </p>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {['all', 'pending', 'approved', 'rejected', 'inactive'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize cursor-pointer transition-colors ${
                filterStatus === st
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {filteredCars.length === 0 ? (
        <EmptyState
          title="No vehicles in this queue"
          description="There are currently no listings matching the selected status."
          className="bg-slate-900 border-slate-800 text-slate-300"
        />
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Owner</th>
                  <th className="py-3 px-4">Zone</th>
                  <th className="py-3 px-4 text-right">Daily Rate</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {filteredCars.map((car) => {
                  const owner = users.find((u) => u.id === car.ownerId);
                  const isPending = car.status === 'pending';

                  return (
                    <tr key={car.id} className="hover:bg-slate-850 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-16 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-950 border border-slate-800">
                            <CarImageFallback
                              src={car.photos[0]}
                              alt={`${car.make} ${car.model}`}
                              fill
                            />
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">
                              {car.make} {car.model}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {car.year} • {car.transmission} • {car.seats} Seats
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{owner?.name || 'Owner'}</div>
                        <div className="text-[11px] text-slate-400">{owner?.email}</div>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-300">
                        {car.neighbourhood}
                      </td>

                      <td className="py-3.5 px-4 text-right font-extrabold text-emerald-400 text-sm">
                        {formatETB(car.pricePerDay)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={car.status} type="car" />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/cars/${car.id}`} target="_blank">
                            <button
                              title="Preview Public Listing"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </Link>

                          {isPending && (
                            <>
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleApprove(car.id)}
                                className="bg-emerald-600 hover:bg-emerald-500 py-1 px-2.5 text-xs"
                              >
                                <Check className="w-3.5 h-3.5 mr-1" />
                                Approve
                              </Button>

                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => setRejectModalCar(car)}
                                className="py-1 px-2.5 text-xs"
                              >
                                <X className="w-3.5 h-3.5 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}

                          {!isPending && car.status === 'rejected' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApprove(car.id)}
                              className="text-xs text-emerald-400 border-emerald-500/40"
                            >
                              Re-Approve
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      <Modal
        isOpen={!!rejectModalCar}
        onClose={() => setRejectModalCar(null)}
        title="Reject Listing Submission"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Provide a moderation explanation for why this vehicle ({rejectModalCar?.make}{' '}
            {rejectModalCar?.model}) does not meet Sheggar Wheels standards.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Moderation Reason
            </label>
            <textarea
              rows={3}
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="e.g. Unclear photos, excessive daily rate, or mechanical compliance check required..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setRejectModalCar(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={loading}
              onClick={handleConfirmReject}
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
