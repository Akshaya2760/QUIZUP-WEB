import React from 'react';
import { Compass, ArrowLeft, Home } from 'lucide-react';

interface NotFoundPageProps {
  onNavigate: (view: string) => void;
}

export function NotFoundPage({ onNavigate }: NotFoundPageProps) {
  return (
    <div className="min-h-[75vh] flex items-center justify-center py-16 px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 shadow-[0_0_25px_rgba(245,158,11,0.2)]">
          <Compass className="w-10 h-10 animate-spin" style={{ animationDuration: '12s' }} />
        </div>

        <h1 className="text-5xl font-display font-black text-amber-400">404</h1>
        <h2 className="text-xl font-bold text-white mt-2">Quiz Arena Coordinates Not Found</h2>
        <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
          The exam room, student record, or question module you requested cannot be located in the database.
        </p>

        <div className="mt-8 flex justify-center gap-3">
          <button
            onClick={() => onNavigate('landing')}
            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-2 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Return to Campus Home</span>
          </button>
        </div>
      </div>
    </div>
  );
}
