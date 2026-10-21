'use client';

import { useState } from 'react';
import { useStore } from '@/lib/useStore';
import { formatDate } from '@/lib/format';
import Button from '@/components/ui/Button';
import { Bell, Plus, Power, Trash2, CheckCircle2 } from 'lucide-react';

export default function AdminAnnouncementsPage() {
  const { announcements, createAnnouncementAction, toggleAnnouncementAction, showToast } =
    useStore();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      showToast('Please provide both title and message', 'error');
      return;
    }

    setLoading(true);
    const res = createAnnouncementAction({ title, message });
    setLoading(false);

    if (res.success) {
      setTitle('');
      setMessage('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Broadcast Announcements ({announcements.length})
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Publish system-wide alert banners to visitors, renters, and hosts across Sheggar Wheels.
        </p>
      </div>

      {/* Create Announcement Form */}
      <form
        onSubmit={handleSubmit}
        className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm"
      >
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Bell className="w-4 h-4 text-emerald-400" />
          Create New Platform Announcement
        </h2>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Banner Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 🌧️ Rainy Season Notice, 🎉 Weekend Special"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:ring-2 focus:ring-rose-500 min-h-[40px]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Announcement Message
          </label>
          <textarea
            rows={2}
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Brief notice text shown on the global header..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={loading}
            className="bg-emerald-600 hover:bg-emerald-500 font-bold"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Publish Active Banner
          </Button>
        </div>
      </form>

      {/* Announcements List */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Existing Announcements
        </h2>

        {announcements.length === 0 ? (
          <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-500">
            No announcements created yet.
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{ann.title}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        ann.active
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}
                    >
                      {ann.active ? 'Active on site' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{ann.message}</p>
                  <span className="text-[10px] text-slate-500 block">
                    Posted on {formatDate(ann.createdAt)}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleAnnouncementAction(ann.id)}
                    className="text-xs"
                  >
                    <Power className="w-3.5 h-3.5 mr-1" />
                    {ann.active ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
