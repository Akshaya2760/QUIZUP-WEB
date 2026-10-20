import React from 'react';
import {
  Trophy,
  BrainCircuit,
  ShieldCheck,
  Timer,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Users,
  Award,
  BookOpen,
} from 'lucide-react';
import { AnimatedMascot } from '../components/common/AnimatedMascot.tsx';

interface LandingPageProps {
  onNavigate: (view: string) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="relative overflow-hidden">
      {/* Background glowing orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute top-3/4 left-1/4 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center">
        {/* Animated Scholar Mascot */}
        <AnimatedMascot mode="welcome" />

        {/* Brand Headline */}
        <h1 className="text-4xl sm:text-6xl font-display font-extrabold tracking-tight text-white mb-4">
          <span className="text-white">QUIZ</span>
          <span className="gold-gradient-text drop-shadow-[0_0_35px_rgba(245,158,11,0.35)]">UP</span>
        </h1>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => onNavigate('student-register')}
            className="px-7 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:shadow-[0_0_35px_rgba(245,158,11,0.6)] hover:scale-[1.02] transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>Register as Student</span>
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </button>

          <button
            onClick={() => onNavigate('student-login')}
            className="px-7 py-3.5 rounded-xl font-semibold text-sm bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-amber-500/30 hover:border-amber-400 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>Student Sign In</span>
          </button>

          <button
            onClick={() => onNavigate('leaderboard')}
            className="px-6 py-3.5 rounded-xl font-semibold text-sm bg-slate-950/60 hover:bg-slate-900 text-amber-300 border border-amber-500/20 hover:border-amber-500/40 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>View Hall of Fame</span>
          </button>
        </div>

        {/* Metrics Bar */}
        <div className="mt-16 pt-10 border-t border-amber-500/15 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-amber-500/10 backdrop-blur-sm">
            <p className="text-3xl font-display font-extrabold text-white">100%</p>
            <p className="text-xs text-amber-400/80 font-medium mt-1">Verified College Students</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-amber-500/10 backdrop-blur-sm">
            <p className="text-3xl font-display font-extrabold text-amber-400">Strict</p>
            <p className="text-xs text-amber-400/80 font-medium mt-1">Server-Side Scoring</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-amber-500/10 backdrop-blur-sm">
            <p className="text-3xl font-display font-extrabold text-white">Atlas</p>
            <p className="text-xs text-amber-400/80 font-medium mt-1">Permanent Persistence</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-amber-500/10 backdrop-blur-sm">
            <p className="text-3xl font-display font-extrabold text-amber-400">Gemini</p>
            <p className="text-xs text-amber-400/80 font-medium mt-1">AI Study Mentor</p>
          </div>
        </div>
      </section>

      {/* Feature Pillar Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-white">
            Built for Serious Academic Competition
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Engineered with strict exam integrity and comprehensive college administration controls.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#0d152c]/80 border border-amber-500/20 backdrop-blur-md hover:border-amber-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-5">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Admin Approval Gate</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every student account requires institutional verification. Administrators review student IDs and
              departments before quiz privileges are granted.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0d152c]/80 border border-amber-500/20 backdrop-blur-md hover:border-amber-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-5">
              <Timer className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Real-Time Exam Engine</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Strict countdown timer enforcement with automatic saving and submission. Correct answers are calculated
              server-side, never exposed client-side.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0d152c]/80 border border-amber-500/20 backdrop-blur-md hover:border-amber-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-5">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Gemini AI Study Mentor</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Deep dive into tricky quiz questions, generate customized practice drills, and receive personalized
              revision roadmaps powered by Gemini.
            </p>
          </div>
        </div>
      </section>

      {/* Rules & Integrity Box */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="p-8 rounded-3xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-amber-500/5 border border-amber-500/30">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">Academic Integrity</span>
              <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">Deterministic Ranking & Tie-Breakers</h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl">
                Rankings adhere to strict rules: highest score takes 1st place. In case of ties, the student with the
                shorter elapsed duration takes precedence. Server submission timestamps act as final tie-breaker.
              </p>
            </div>
            <button
              onClick={() => onNavigate('leaderboard')}
              className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs whitespace-nowrap transition-colors"
            >
              Explore Leaderboard
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
