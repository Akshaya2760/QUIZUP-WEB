import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Award,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { Quiz } from '../../types/index.ts';

interface QuizListPageProps {
  onNavigate: (view: string, data?: any) => void;
}

export function QuizListPage({ onNavigate }: QuizListPageProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadQuizzes() {
      try {
        const res = await api.getQuizzes({
          search: search || undefined,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          difficulty: selectedDifficulty !== 'all' ? selectedDifficulty : undefined,
        });
        setQuizzes(res.quizzes || []);
      } catch (err) {
        console.warn('Failed to load quizzes:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadQuizzes();
  }, [search, selectedCategory, selectedDifficulty]);

  const categories = ['all', 'Computer Science', 'Information Technology', 'General Knowledge'];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white flex items-center gap-2.5">
          <BookOpen className="w-7 h-7 text-amber-400" />
          <span>Quiz Arena</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Explore and compete in timed collegiate evaluations.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0d152c]/90 border border-amber-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search quizzes by title or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mr-2">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            <span>Category:</span>
          </div>

          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-amber-400"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Quizzes Grid */}
      {quizzes.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#0d152c]/50 border border-slate-800">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No quizzes found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or filter options to discover other active competitions.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => {
            const hasAttempted = Boolean(quiz.myAttempt);
            return (
              <div
                key={quiz._id}
                className="navy-card rounded-2xl p-6 border border-amber-500/20 hover:border-amber-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-amber-300 border border-amber-500/20">
                      {quiz.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        quiz.difficulty === 'easy'
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : quiz.difficulty === 'medium'
                          ? 'bg-amber-500/15 text-amber-300'
                          : 'bg-rose-500/15 text-rose-300'
                      }`}
                    >
                      {quiz.difficulty}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-1.5">{quiz.title}</h3>
                  <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed mb-4">
                    {quiz.description}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-800">
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{quiz.durationMinutes} Minutes</span>
                    </div>
                    <div>
                      <span>{quiz.totalQuestions} Questions</span>
                    </div>
                    <div>
                      <span>+{quiz.marksPerCorrect} marks / correct</span>
                    </div>
                    <div>
                      <span className={quiz.negativeMarks > 0 ? 'text-rose-400' : 'text-slate-500'}>
                        {quiz.negativeMarks > 0 ? `-${quiz.negativeMarks} negative` : 'No negative'}
                      </span>
                    </div>
                  </div>

                  {hasAttempted ? (
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-1.5 text-xs text-emerald-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="font-semibold">Score: {quiz.myAttempt?.score} pts</span>
                      </div>
                      <button
                        onClick={() => onNavigate('results', { attemptId: quiz.myAttempt?._id })}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold border border-emerald-500/40 transition-colors"
                      >
                        View Analysis
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onNavigate('quiz-instructions', { quizId: quiz._id })}
                      className="w-full py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.25)] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Take Quiz</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
