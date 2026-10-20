import React, { useState, useEffect } from 'react';
import { Bell, Calendar, User, AlertCircle, Info, Sparkles } from 'lucide-react';
import { api } from '../../services/api.ts';
import { Announcement } from '../../types/index.ts';

export function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAnnouncements() {
      try {
        const res = await api.getAnnouncements();
        setAnnouncements(res.announcements || []);
      } catch (err) {
        console.warn('Failed to load announcements:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAnnouncements();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white flex items-center gap-3">
          <Bell className="w-8 h-8 text-amber-400" />
          <span>Campus Announcements & Bulletins</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Official institutional directives, exam schedules, and curriculum updates.
        </p>
      </div>

      {isLoading ? (
        <div className="min-h-[30vh] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin"></div>
        </div>
      ) : announcements.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#0d152c]/50 border border-slate-800">
          <Bell className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-white">No active announcements</h3>
          <p className="text-xs text-slate-400 mt-1">Check back soon for upcoming campus notices.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => {
            const isUrgent = ann.priority === 'urgent' || ann.priority === 'high';
            return (
              <div
                key={ann._id}
                className={`p-6 rounded-3xl border transition-all ${
                  isUrgent
                    ? 'bg-[#181324]/90 border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.1)]'
                    : 'navy-card border-amber-500/20 shadow-lg'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        ann.priority === 'urgent'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : ann.priority === 'high'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      }`}
                    >
                      {ann.priority} Priority
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      Target: {ann.targetAudience === 'department' ? ann.targetDepartment : 'All Students'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white mt-3">{ann.title}</h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed whitespace-pre-line">
                  {ann.message}
                </p>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-amber-400" /> Posted by {ann.authorName || 'Administrator'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
