import React, { useState, useEffect } from 'react';
import {
  Clock,
  ShieldAlert,
  CheckSquare,
  ArrowRight,
  AlertTriangle,
  Award,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { Quiz } from '../../types/index.ts';

interface QuizInstructionsPageProps {
  quizId: string;
  onNavigate: (view: string, data?: any) => void;
}

export function QuizInstructionsPage({ quizId, onNavigate }: QuizInstructionsPageProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadQuiz() {
      try {
        const res = await api.getQuizDetails(quizId);
        setQuiz(res.quiz);

        // If student already completed it, prompt to view result
        if (res.myAttempt && (res.myAttempt.status === 'submitted' || res.myAttempt.status === 'timed_out')) {
          onNavigate('results', { attemptId: res.myAttempt._id });
        }
      } catch (err: any) {
        setError(err.message || 'Could not load quiz details.');
      } finally {
        setIsLoading(false);
      }
    }
    loadQuiz();
  }, [quizId]);

  const handleStartQuiz = async () => {
    if (!agreed) {
      setError('Please acknowledge the honor code and exam instructions before starting.');
      return;
    }

    setIsStarting(true);
    setError(null);
    try {
      const res = await api.startQuiz(quizId);
      onNavigate('live-quiz', {
        quizId,
        attempt: res.attempt,
        questions: res.questions,
        serverTime: res.serverTime,
      });
    } catch (err: any) {
      if (err.code === 'ALREADY_COMPLETED' && err.data?.attemptId) {
        onNavigate('results', { attemptId: err.data.attemptId });
        return;
      }
      setError(err.message || 'Failed to start quiz attempt.');
      setIsStarting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>Quiz could not be found or is not open for attempts.</p>
        <button
          onClick={() => onNavigate('quiz-list')}
          className="mt-4 px-4 py-2 bg-slate-800 text-amber-400 rounded-lg text-xs"
        >
          Return to Quizzes
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      <button
        onClick={() => onNavigate('quiz-list')}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Quiz Arena</span>
      </button>

      <div className="navy-card rounded-3xl p-6 sm:p-10 border border-amber-500/25 shadow-2xl space-y-6">
        {/* Title */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-amber-300 border border-amber-500/30">
              {quiz.category}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
              {quiz.difficulty} Level
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white">{quiz.title}</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">{quiz.description}</p>
        </div>

        {/* Quick Parameters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
          <div>
            <p className="text-[11px] text-slate-400">Time Limit</p>
            <p className="text-lg font-display font-bold text-amber-400 mt-0.5">{quiz.durationMinutes} Mins</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Questions</p>
            <p className="text-lg font-display font-bold text-white mt-0.5">{quiz.questions?.length || quiz.totalQuestions}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Correct Mark</p>
            <p className="text-lg font-display font-bold text-emerald-400 mt-0.5">+{quiz.marksPerCorrect}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Negative Penalty</p>
            <p className="text-lg font-display font-bold text-rose-400 mt-0.5">
              {quiz.negativeMarks > 0 ? `-${quiz.negativeMarks}` : '0'}
            </p>
          </div>
        </div>

        {/* Instructions list */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Institutional Examination Guidelines</span>
          </h3>

          <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
            <li>
              The examination timer starts immediately once you click <span className="text-amber-400 font-semibold">Start Timed Quiz</span>.
            </li>
            <li>
              Your selections are automatically saved in real-time to the institutional database.
            </li>
            <li>
              You can navigate back and forth between questions using the question navigation palette.
            </li>
            <li>
              You can mark questions for review and return to them prior to final submission.
            </li>
            <li>
              When the countdown reaches <span className="font-mono text-amber-400">00:00</span>, the server will automatically submit and score all saved answers.
            </li>
            <li>
              Rankings are deterministic based on <span className="font-semibold text-white">Score → Elapsed Duration → Server Timestamp</span>.
            </li>
          </ul>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Honor code agreement */}
        <div className="pt-2">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 rounded border-amber-500/40 text-amber-500 focus:ring-amber-400 w-4 h-4 bg-slate-950"
            />
            <span className="text-xs text-slate-300">
              I agree to abide by the collegiate academic honor code. I will complete this timed evaluation
              independently without unauthorized aids or tabs.
            </span>
          </label>
        </div>

        {/* Start button */}
        <div className="pt-2">
          <button
            onClick={handleStartQuiz}
            disabled={isStarting || !agreed}
            className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isStarting ? (
              <span>Initializing secure exam session...</span>
            ) : (
              <>
                <span>Start Timed Quiz</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
