import React, { useState } from 'react';
import { Database, CheckCircle2, AlertTriangle, RefreshCw, ChevronDown, ChevronUp, Server } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';

export function DatabaseBanner() {
  const { health, isDbConnected, refreshHealth } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [mongoInput, setMongoInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectMsg, setConnectMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mongoInput.trim()) return;

    setIsConnecting(true);
    setConnectMsg(null);
    try {
      const res = await api.connectDb(mongoInput.trim());
      setConnectMsg({ type: 'success', text: res.message || 'Connected to MongoDB Atlas!' });
      await refreshHealth();
    } catch (err: any) {
      setConnectMsg({ type: 'error', text: err.message || 'Connection failed.' });
    } finally {
      setIsConnecting(false);
    }
  };

  if (isDbConnected) {
    return (
      <div className="bg-emerald-950/40 border-b border-emerald-500/20 text-emerald-300 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-emerald-200">MongoDB Atlas:</span>
            <span>Connected ({health?.database?.databaseName || 'QUIZUP'})</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-emerald-400/70 hidden sm:inline">Persistent Storage Active</span>
            <button
              onClick={() => refreshHealth()}
              title="Refresh connection status"
              className="hover:text-emerald-100 transition-colors p-0.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-950/60 border-b border-amber-500/30 text-amber-200 text-xs py-2 px-4 shadow-md backdrop-blur-md">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-bounce-subtle" />
            <div>
              <span className="font-bold text-amber-300">MongoDB Atlas: </span>
              <span>
                {health?.database?.state === 'connecting'
                  ? 'Connecting to cluster...'
                  : 'Database not connected (Set MONGODB_URI in environment)'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-medium transition-all"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Configure Atlas URI</span>
              {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="mt-3 pt-3 border-t border-amber-500/20 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 text-slate-300">
              <p className="font-semibold text-amber-300">How to connect MongoDB Atlas:</p>
              <p className="text-[11px] leading-relaxed">
                Add <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300">MONGODB_URI</code> to your{' '}
                <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300">.env</code> file or Vercel
                Environment Variables targeting the <span className="text-amber-400 font-medium">QUIZUP</span> database:
              </p>
              <div className="bg-slate-950/80 p-2 rounded border border-amber-500/20 text-[10px] font-mono text-amber-100 break-all select-all">
                mongodb+srv://&lt;username&gt;:&lt;password&gt;@cluster0.abcde.mongodb.net/QUIZUP?retryWrites=true&w=majority
              </div>
            </div>

            <div>
              <p className="font-semibold text-amber-300 mb-1.5">Direct Connect & Initialize:</p>
              <form onSubmit={handleConnect} className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="mongodb+srv://user:pass@cluster.mongodb.net/QUIZUP..."
                  value={mongoInput}
                  onChange={(e) => setMongoInput(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-950/90 border border-amber-500/40 rounded text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isConnecting}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isConnecting && <RefreshCw className="w-3 h-3 animate-spin" />}
                    <span>Test & Save Connection</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => refreshHealth()}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors"
                  >
                    Check Status
                  </button>
                </div>
              </form>
              {connectMsg && (
                <p
                  className={`mt-2 text-xs font-medium ${
                    connectMsg.type === 'success' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {connectMsg.text}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
