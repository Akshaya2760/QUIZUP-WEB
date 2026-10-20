import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, Send, AlertCircle, CheckCircle2, User, Calendar } from 'lucide-react';
import { api } from '../../services/api.ts';
import { Announcement } from '../../types/index.ts';

const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Information Technology & Software',
  'Data Science & Artificial Intelligence',
  'Electronics & Communication Engineering',
  'Electrical & Electronics Engineering',
  'Mechanical & Mechatronics Engineering',
  'Civil & Infrastructure Engineering',
];

export function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('normal');
  const [targetAudience, setTargetAudience] = useState('all');
  const [targetDepartment, setTargetDepartment] = useState(DEPARTMENTS[0]);
  const [isPublishing, setIsPublishing] = useState(false);

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAnnouncements();
      setAnnouncements(res.announcements || []);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to load announcements.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setIsPublishing(true);
    setMsg(null);
    try {
      await api.createAnnouncement({
        title: title.trim(),
        message: message.trim(),
        priority,
        targetAudience,
        targetDepartment: targetAudience === 'department' ? targetDepartment : undefined,
      });

      setMsg({ type: 'success', text: `Announcement "${title}" posted to student boards.` });
      setTitle('');
      setMessage('');
      fetchAnnouncements();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to post announcement.' });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string, annTitle: string) => {
    if (!confirm(`Delete announcement "${annTitle}"?`)) return;
    try {
      await api.deleteAnnouncement(id);
      setMsg({ type: 'success', text: 'Announcement deleted.' });
      fetchAnnouncements();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white flex items-center gap-3">
          <Bell className="w-8 h-8 text-amber-400" />
          <span>Announcements & Directives Control</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Publish official exam announcements, college competition schedules, and departmental notices.
        </p>
      </div>

      {msg && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 ${
            msg.type === 'success'
              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
              : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Create Announcement Form Card */}
      <div className="navy-card rounded-3xl p-6 sm:p-8 border border-amber-500/20 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Broadcast New Notice</span>
        </h3>

        <form onSubmit={handleCreateAnnouncement} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Notice Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Schedule for Mid-Term Algorithms Championship"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Audience</label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="all">All College Students</option>
                <option value="department">Specific Department Only</option>
              </select>
            </div>

            {targetAudience === 'department' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Department</label>
                <select
                  value={targetDepartment}
                  onChange={(e) => setTargetDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Message Content</label>
            <textarea
              required
              rows={3}
              placeholder="Full directive details, dates, and instructions..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <button
            type="submit"
            disabled={isPublishing}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Publish Announcement</span>
          </button>
        </form>
      </div>

      {/* Existing Announcements List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white">Active Announcements ({announcements.length})</h3>

        {announcements.map((ann) => (
          <div
            key={ann._id}
            className="navy-card rounded-2xl p-5 border border-amber-500/20 flex flex-col sm:flex-row items-start justify-between gap-4"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    ann.priority === 'urgent'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {ann.priority}
                </span>
                <span className="text-xs text-slate-400">
                  To: {ann.targetAudience === 'department' ? ann.targetDepartment : 'All Students'}
                </span>
                <span className="text-[10px] text-slate-500">• {new Date(ann.createdAt).toLocaleDateString()}</span>
              </div>
              <h4 className="text-sm font-bold text-white">{ann.title}</h4>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{ann.message}</p>
            </div>

            <button
              onClick={() => handleDeleteAnnouncement(ann._id, ann.title)}
              className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors"
              title="Delete announcement"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
