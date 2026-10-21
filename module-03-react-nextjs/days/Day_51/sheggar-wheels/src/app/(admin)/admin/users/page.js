'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/useStore';
import { formatDate } from '@/lib/format';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { Users, Search, ShieldCheck, ShieldAlert, UserCheck, Eye } from 'lucide-react';

export default function AdminUsersPage() {
  const { users, currentUser, updateUserStatusAction, showToast } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const text = `${u.name} ${u.email} ${u.phone}`.toLowerCase();
        if (!text.includes(q)) return false;
      }

      if (roleFilter !== 'all' && !u.roles.includes(roleFilter)) {
        return false;
      }

      return true;
    });
  }, [users, searchQuery, roleFilter]);

  const handleToggleStatus = (targetUser) => {
    if (targetUser.id === currentUser?.id) {
      showToast('You cannot suspend your own admin account', 'error');
      return;
    }

    const nextStatus = targetUser.status === 'suspended' ? 'active' : 'suspended';
    updateUserStatusAction(targetUser.id, nextStatus);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            User Accounts & Governance ({users.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Audit user roles, active vs suspended credentials, and platform activity logs.
          </p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:ring-2 focus:ring-rose-500 min-h-[40px]"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3.5" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400">Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:ring-2 focus:ring-rose-500 min-h-[40px]"
          >
            <option value="all">All Roles</option>
            <option value="renter">Renter</option>
            <option value="owner">Host / Owner</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Roles</th>
                <th className="py-3 px-4">Registered</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filteredUsers.map((u) => {
                const isSelf = u.id === currentUser?.id;
                const isSuspended = u.status === 'suspended';

                return (
                  <tr key={u.id} className="hover:bg-slate-850 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm flex items-center gap-2">
                        {u.name}
                        {isSelf && (
                          <span className="text-[10px] text-rose-400 bg-rose-950/60 border border-rose-800 px-1.5 py-0.2 rounded-xs">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-400">{u.phone}</td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((r) => (
                          <span
                            key={r}
                            className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm ${
                              r === 'admin'
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : r === 'owner'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            }`}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400">{formatDate(u.createdAt)}</td>

                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={u.status} type="user" />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/users/${u.id}`}>
                          <button
                            title="View Profile Details"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </Link>

                        {!isSelf && (
                          <Button
                            size="sm"
                            variant={isSuspended ? 'outline' : 'danger'}
                            onClick={() => handleToggleStatus(u)}
                            className="py-1 px-2.5 text-xs"
                          >
                            {isSuspended ? 'Reinstate' : 'Suspend'}
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
    </div>
  );
}
