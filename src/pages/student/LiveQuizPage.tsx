import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  CheckCircle,
  AlertTriangle,
  Send,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { Attempt, Question } from '../../types/index.ts';

interface LiveQuizPageProps {
  quizId: string;
  attempt: Attempt;
  questions: Question[];
  serverTime: number;
  onNavigate: (view: string, data?: any) => void;
}

export function LiveQuizPage({
  quizId,
  attempt: initialAttempt,
  questions,
  serverTime,
  onNavigate,
}: LiveQuizPageProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  // answers: questionId -> selectedOption (0, 1, 2, 3)
  const [answers, setAnswers] = useState<Record<string, number>>(
    initialAttempt.answers ? (initialAttempt.answers as any) : {}
  );
  const [markedForReview, setMarkedForReview] = useState<string[]>(
    initialAttempt.markedForReview || []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  // Timer Calculation
  // Quiz duration in seconds
  const totalDurationSeconds = (initialAttempt as any).durationMinutes
    ? (initialAttempt as any).durationMinutes * 60
    : 15 * 60; // fallback if not directly on attempt

  // Remaining seconds computed from startedAt and serverTime
  const startedAtMs = new Date(initialAttempt.startedAt).getTime();
  const elapsedSeconds = Math.max(0, Math.floor((serverTime - startedAtMs) / 1000));
  const [remainingSeconds, setRemainingSeconds] = useState(
    Math.max(0, totalDurationSeconds - elapsedSeconds)
  );

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSubmittedRef = useRef(false);

  // Auto-save debounce
  const triggerAutoSave = (newAnswers: Record<string, number>, newMarked: string[]) => {
    setSaveStatus('saving');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(async () => {
      try {
        await api.saveQuizProgress(quizId, initialAttempt._id, newAnswers, newMarked);
        setSaveStatus('saved');
      } catch (err) {
        console.warn('Auto-save error:', err);
        setSaveStatus('error');
      }
    }, 600);
  };

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!isSubmittedRef.current) {
            handleFinalSubmit(true); // Auto-submit on expiry
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format time MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Select Option
  const handleSelectOption = (optionIndex: number) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const newAnswers = {
      ...answers,
      [currentQ._id]: optionIndex,
    };
    setAnswers(newAnswers);
    triggerAutoSave(newAnswers, markedForReview);
  };

  // Clear current response
  const handleClearResponse = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const newAnswers = { ...answers };
    delete newAnswers[currentQ._id];
    setAnswers(newAnswers);
    triggerAutoSave(newAnswers, markedForReview);
  };

  // Toggle Mark for review
  const handleToggleMarkReview = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    let newMarked: string[];
    if (markedForReview.includes(currentQ._id)) {
      newMarked = markedForReview.filter((id) => id !== currentQ._id);
    } else {
      newMarked = [...markedForReview, currentQ._id];
    }
    setMarkedForReview(newMarked);
    triggerAutoSave(answers, newMarked);
  };

  // Final Submit
  const handleFinalSubmit = async (isAutoExpire = false) => {
    if (isSubmittedRef.current || isSubmitting) return;
    isSubmittedRef.current = true;
    setIsSubmitting(true);

    try {
      const res = await api.submitQuiz(quizId, initialAttempt._id, answers);
      onNavigate('results', { attemptId: res.result._id });
    } catch (err: any) {
      console.error('Submission failed:', err);
      // If already submitted, navigate directly
      if (err.data?.result?._id) {
        onNavigate('results', { attemptId: err.data.result._id });
        return;
      }
      isSubmittedRef.current = false;
      setIsSubmitting(false);
      alert(err.message || 'Submission failed. Please try again.');
    }
  };

  const currentQuestion = questions[currentIndex];
  const selectedOption = currentQuestion ? answers[currentQuestion._id] : undefined;
  const isMarked = currentQuestion ? markedForReview.includes(currentQuestion._id) : false;

  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;

  // Timer color
  const timerColor =
    remainingSeconds < 120
      ? 'text-rose-400 bg-rose-500/20 border-rose-500/40 animate-pulse'
      : remainingSeconds < 300
      ? 'text-amber-400 bg-amber-500/20 border-amber-500/40'
      : 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40';

  if (!currentQuestion) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>No questions found in this assessment.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Bar: Title & Real-Time Countdown Timer */}
      <div className="p-4 rounded-2xl bg-[#0d152c]/90 border border-amber-500/20 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 sticky top-16 z-20 shadow-xl">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
            {initialAttempt.quizCategory || 'College Examination'}
          </span>
          <h2 className="text-sm sm:text-base font-bold text-white line-clamp-1">
            {initialAttempt.quizTitle}
          </h2>
        </div>

        <div className="flex items-center gap-4">
          {/* Auto-save indicator */}
          <div className="text-[11px] text-slate-400 hidden sm:flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                saveStatus === 'saved'
                  ? 'bg-emerald-400'
                  : saveStatus === 'saving'
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-rose-400'
              }`}
            ></span>
            <span>{saveStatus === 'saved' ? 'Answers Saved' : saveStatus === 'saving' ? 'Saving...' : 'Retrying Save'}</span>
          </div>

          {/* Countdown Clock */}
          <div
            className={`px-4 py-1.5 rounded-xl border font-mono font-bold text-sm sm:text-base flex items-center gap-2 ${timerColor}`}
          >
            <Clock className="w-4 h-4" />
            <span>{formatTime(remainingSeconds)}</span>
          </div>

          {/* Submit Button */}
          <button
            onClick={() => setShowConfirmModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Finish & Submit</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Question & Options (3 Cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="navy-card rounded-3xl p-6 sm:p-8 border border-amber-500/20 shadow-2xl relative">
            {/* Question Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-slate-400">
                  +{currentQuestion.marks || 1} mark
                </span>
                <button
                  onClick={handleToggleMarkReview}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                    isMarked
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${isMarked ? 'fill-amber-400 text-amber-400' : ''}`} />
                  <span>{isMarked ? 'Marked for Review' : 'Mark for Review'}</span>
                </button>
              </div>
            </div>

            {/* Question Text */}
            <div className="py-6">
              <h3 className="text-base sm:text-lg font-semibold text-white leading-relaxed">
                {currentQuestion.questionText}
              </h3>
            </div>

            {/* Options List */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, optIdx) => {
                const isSelected = selectedOption === optIdx;
                const letter = String.fromCharCode(65 + optIdx); // A, B, C, D
                return (
                  <div
                    key={optIdx}
                    onClick={() => handleSelectOption(optIdx)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 select-none ${
                      isSelected
                        ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/50'
                        : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-amber-500/30 hover:bg-slate-900/60'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {letter}
                    </div>
                    <span className="text-xs sm:text-sm font-medium pt-0.5 leading-relaxed">
                      {option}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bottom Question Controls */}
            <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={handleClearResponse}
                disabled={selectedOption === undefined}
                className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Selection</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 flex items-center gap-1 transition-colors disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <button
                  onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  disabled={currentIndex === questions.length - 1}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1 transition-colors disabled:opacity-30"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Question Palette & Status Summary */}
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-[#0d152c]/90 border border-amber-500/20 shadow-xl">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Question Palette
            </h4>

            {/* Palette Grid */}
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isAns = answers[q._id] !== undefined;
                const isRev = markedForReview.includes(q._id);
                const isCurr = currentIndex === idx;

                let colorClasses = 'bg-slate-950 text-slate-400 border-slate-800'; // Unanswered
                if (isAns && isRev) {
                  colorClasses = 'bg-purple-900/60 text-purple-200 border-purple-500'; // Answered & Marked
                } else if (isAns) {
                  colorClasses = 'bg-emerald-950/80 text-emerald-300 border-emerald-500'; // Answered
                } else if (isRev) {
                  colorClasses = 'bg-amber-950/80 text-amber-300 border-amber-500'; // Marked for Review
                }

                return (
                  <button
                    key={q._id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-xl text-xs font-bold border transition-all flex items-center justify-center relative ${colorClasses} ${
                      isCurr ? 'ring-2 ring-amber-400 scale-105' : 'hover:scale-102'
                    }`}
                  >
                    <span>{idx + 1}</span>
                    {isRev && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute top-1 right-1"></span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-5 pt-4 border-t border-slate-800 space-y-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-500"></span>
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-slate-800 border border-slate-700"></span>
                <span>Unanswered ({unansweredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-amber-500"></span>
                <span>Marked for Review ({markedForReview.length})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal Before Submission */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="navy-card max-w-md w-full rounded-3xl p-6 sm:p-8 border border-amber-500/40 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2">
              <Send className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold text-white">Confirm Final Submission</h3>
            <p className="text-xs text-slate-300">
              Are you sure you want to finalize this exam attempt? Once submitted, your answers will be evaluated
              and your score recorded.
            </p>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-slate-400">Answered</p>
                <p className="text-lg font-bold text-emerald-400">{answeredCount}</p>
              </div>
              <div>
                <p className="text-slate-400">Unanswered</p>
                <p className="text-lg font-bold text-rose-400">{unansweredCount}</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800"
              >
                Back to Questions
              </button>

              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  handleFinalSubmit(false);
                }}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold text-xs shadow-lg hover:scale-102 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Scoring Answers...' : 'Yes, Submit Exam'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
