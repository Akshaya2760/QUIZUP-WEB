import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  BrainCircuit,
  Share2,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { Attempt } from '../../types/index.ts';

interface QuizResultPageProps {
  attemptId: string;
  onNavigate: (view: string, data?: any) => void;
}

export function QuizResultPage({ attemptId, onNavigate }: QuizResultPageProps) {
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [totalParticipants, setTotalParticipants] = useState<number>(1);
  const [quizDetails, setQuizDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuestionForAi, setSelectedQuestionForAi] = useState<any>(null);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    async function loadResult() {
      try {
        const res = await api.getAttemptResult(attemptId);
        setAttempt(res.attempt);
        setRank(res.rank);
        setTotalParticipants(res.totalParticipants);
        setQuizDetails(res.quizDetails);

        // If passed or high score, trigger celebratory confetti!
        if (res.attempt.isPassed || res.attempt.accuracyPercent >= 70) {
          try {
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#F59E0B', '#FDE68A', '#38BDF8', '#10B981'],
            });
          } catch {
            // Ignore confetti errors if canvas fails
          }
        }
      } catch (err) {
        console.warn('Failed to load attempt result:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadResult();
  }, [attemptId]);

  const handleAskAiToExplain = async (q: any) => {
    setSelectedQuestionForAi(q);
    setIsAiLoading(true);
    setAiExplanation(null);

    try {
      const res = await api.explainQuestionAi({
        questionText: q.questionText,
        options: q.options,
        selectedOption: q.selectedOption,
        correctOption: q.correctOption,
        explanation: q.explanation,
        topic: attempt?.quizCategory,
      });

      if (res.available && res.explanation) {
        setAiExplanation(res.explanation);
      } else {
        setAiExplanation(res.error || 'Gemini AI explanation unavailable.');
      }
    } catch (err: any) {
      setAiExplanation(err.message || 'Could not contact Gemini AI service.');
    } finally {
      setIsAiLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>Result record not found.</p>
        <button
          onClick={() => onNavigate('student-dashboard')}
          className="mt-4 px-4 py-2 bg-slate-800 text-amber-400 rounded-lg text-xs"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const durationMin = Math.floor(attempt.durationSeconds / 60);
  const durationSec = attempt.durationSeconds % 60;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Hero Score Card */}
      <div className="navy-card rounded-3xl p-8 sm:p-10 border border-amber-500/30 text-center relative shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-3">
          <span
            className={`px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
              attempt.isPassed
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
            }`}
          >
            {attempt.isPassed ? 'Assessment Passed' : 'Assessment Incomplete / Below Threshold'}
          </span>

          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white">
            {attempt.quizTitle}
          </h1>

          <p className="text-xs text-slate-300">
            Student: <span className="text-amber-300 font-semibold">{attempt.studentName}</span> ({attempt.studentDepartment})
          </p>

          {/* Big Score Display */}
          <div className="py-6 flex items-baseline justify-center gap-2">
            <span className="text-5xl sm:text-7xl font-display font-black text-amber-400 drop-shadow-[0_0_25px_rgba(245,158,11,0.4)]">
              {attempt.score}
            </span>
            <span className="text-xl sm:text-2xl font-semibold text-slate-400">
              / {attempt.totalPossibleMarks} pts
            </span>
          </div>

          {/* Primary Metrics Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Accuracy</span>
              <span className="text-lg font-bold text-emerald-400">{attempt.accuracyPercent}%</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Time Elapsed</span>
              <span className="text-lg font-bold text-white">
                {durationMin}m {durationSec}s
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Rank in Quiz</span>
              <span className="text-lg font-bold text-amber-400">
                #{rank || 1} of {totalParticipants}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Breakdown</span>
              <span className="text-xs font-semibold text-slate-200">
                <span className="text-emerald-400 font-bold">{attempt.correctCount}C</span> /{' '}
                <span className="text-rose-400 font-bold">{attempt.incorrectCount}W</span> /{' '}
                <span className="text-slate-400 font-bold">{attempt.unansweredCount}U</span>
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onNavigate('leaderboard', { quizId: attempt.quizId })}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-slate-950 shadow-md transition-all flex items-center gap-1.5"
            >
              <Trophy className="w-4 h-4" />
              <span>View Leaderboard</span>
            </button>

            <button
              onClick={() => onNavigate('student-dashboard')}
              className="px-4 py-2.5 rounded-xl font-semibold text-xs bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Question By Question Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span>Question Review & Explanations</span>
          </h2>
          <span className="text-xs text-slate-400">
            {attempt.questionResults?.length || 0} Questions Evaluated
          </span>
        </div>

        <div className="space-y-4">
          {attempt.questionResults?.map((q, idx) => {
            const letter = (i: number | null) => (i !== null && i !== undefined ? String.fromCharCode(65 + i) : '-');
            return (
              <div
                key={q.questionId || idx}
                className={`p-6 rounded-3xl border transition-all ${
                  q.isCorrect
                    ? 'bg-[#0a1827]/80 border-emerald-500/30'
                    : q.selectedOption === null
                    ? 'bg-[#0f1424]/80 border-slate-800'
                    : 'bg-[#1a0f1e]/80 border-rose-500/30'
                }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Question {idx + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    {q.isCorrect ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Correct (+{q.marksAwarded})
                      </span>
                    ) : q.selectedOption === null ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                        Unanswered (0)
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-rose-400" /> Incorrect ({q.marksAwarded})
                      </span>
                    )}

                    <button
                      onClick={() => handleAskAiToExplain(q)}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1 transition-colors"
                    >
                      <BrainCircuit className="w-3 h-3 text-amber-400" />
                      <span>Ask AI Mentor</span>
                    </button>
                  </div>
                </div>

                <p className="text-sm font-semibold text-white mt-3 leading-relaxed">
                  {q.questionText}
                </p>

                {/* Options display */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = q.selectedOption === optIdx;
                    const isCorrect = q.correctOption === optIdx;

                    let bgClass = 'bg-slate-950/60 border-slate-800 text-slate-300';
                    if (isCorrect) {
                      bgClass = 'bg-emerald-950/70 border-emerald-500/60 text-emerald-200 font-semibold';
                    } else if (isSelected && !isCorrect) {
                      bgClass = 'bg-rose-950/70 border-rose-500/60 text-rose-200 line-through';
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`p-2.5 rounded-xl border flex items-center gap-2 ${bgClass}`}
                      >
                        <span className="w-5 h-5 rounded bg-black/40 flex items-center justify-center font-bold text-[10px]">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="truncate">{opt}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {q.explanation && (
                  <div className="mt-3.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
                    <span className="font-bold text-amber-300">Explanation: </span>
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Explanation Modal */}
      {selectedQuestionForAi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="navy-card max-w-lg w-full rounded-3xl p-6 sm:p-8 border border-amber-500/40 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">AI Study Mentor Analysis</h3>
              </div>
              <button
                onClick={() => setSelectedQuestionForAi(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-xs text-slate-300 italic border-l-2 border-amber-500/40 pl-3">
              "{selectedQuestionForAi.questionText}"
            </p>

            {isAiLoading ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin mx-auto"></div>
                <p className="text-xs text-amber-300">Gemini AI is analyzing the concept and mistakes...</p>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                {aiExplanation}
              </div>
            )}

            <button
              onClick={() => setSelectedQuestionForAi(null)}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
            >
              Understood, Return to Results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
