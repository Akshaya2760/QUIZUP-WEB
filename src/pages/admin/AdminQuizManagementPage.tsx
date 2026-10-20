import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  CheckCircle,
  Clock,
  HelpCircle,
  Save,
  X,
  AlertCircle,
  Copy,
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { Quiz, Question } from '../../types/index.ts';

export function AdminQuizManagementPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);

  // Quiz Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Computer Science');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [marksPerCorrect, setMarksPerCorrect] = useState(2);
  const [negativeMarks, setNegativeMarks] = useState(0);
  const [passingScore, setPassingScore] = useState(50);
  const [instructions, setInstructions] = useState('Strict timing rules apply. Answer all questions.');
  const [isPublished, setIsPublished] = useState(false);
  const [randomizeQuestions, setRandomizeQuestions] = useState(false);

  // Question List in Editor
  const [questions, setQuestions] = useState<any[]>([
    {
      questionText: 'What is the primary role of a database index in MongoDB?',
      options: [
        'To compress database storage on disk',
        'To support efficient execution of queries and reduce documents scanned',
        'To enforce strong ACID transactions across servers',
        'To encrypt sensitive student passwords',
      ],
      correctOption: 1,
      explanation: 'Indexes store a small portion of the collection data set in an easy-to-traverse form, vastly speeding up queries.',
      marks: 2,
    },
  ]);

  const fetchQuizzes = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAdminQuizzes();
      setQuizzes(res.quizzes || []);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to load quizzes.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingQuizId(null);
    setTitle('');
    setDescription('');
    setCategory('Computer Science');
    setDifficulty('medium');
    setDurationMinutes(15);
    setMarksPerCorrect(2);
    setNegativeMarks(0);
    setPassingScore(50);
    setInstructions('Answer each question within the allocated time.');
    setIsPublished(true);
    setRandomizeQuestions(false);
    setQuestions([
      {
        questionText: '',
        options: ['', '', '', ''],
        correctOption: 0,
        explanation: '',
        marks: 2,
      },
    ]);
    setIsEditorOpen(true);
  };

  const handleOpenEditModal = (q: Quiz) => {
    setEditingQuizId(q._id);
    setTitle(q.title);
    setDescription(q.description);
    setCategory(q.category);
    setDifficulty(q.difficulty);
    setDurationMinutes(q.durationMinutes);
    setMarksPerCorrect(q.marksPerCorrect);
    setNegativeMarks(q.negativeMarks || 0);
    setPassingScore(q.passingScore);
    setInstructions(q.instructions || '');
    setIsPublished(q.isPublished);
    setRandomizeQuestions(q.randomizeQuestions);
    setQuestions(
      q.questions && q.questions.length > 0
        ? q.questions.map((item) => ({
            questionText: item.questionText,
            options: item.options,
            correctOption: item.correctOption ?? 0,
            explanation: item.explanation || '',
            marks: item.marks || q.marksPerCorrect,
          }))
        : []
    );
    setIsEditorOpen(true);
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      await api.togglePublishQuiz(id, !currentStatus);
      setMsg({
        type: 'success',
        text: `Quiz is now ${!currentStatus ? 'Published and open to students' : 'Unpublished (Draft)'}.`,
      });
      fetchQuizzes();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  const handleDeleteQuiz = async (id: string, quizTitle: string) => {
    if (!confirm(`Are you sure you want to permanently delete the quiz "${quizTitle}"?`)) return;
    try {
      await api.deleteAdminQuiz(id);
      setMsg({ type: 'success', text: `Quiz "${quizTitle}" deleted successfully.` });
      fetchQuizzes();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        questionText: '',
        options: ['', '', '', ''],
        correctOption: 0,
        explanation: '',
        marks: marksPerCorrect,
      },
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert('Please fill out the title and description.');
      return;
    }

    if (questions.length === 0) {
      alert('Please add at least one question.');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].questionText.trim()) {
        alert(`Question #${i + 1} has empty text.`);
        return;
      }
      for (let j = 0; j < 4; j++) {
        if (!questions[i].options[j]?.trim()) {
          alert(`Question #${i + 1} Option ${String.fromCharCode(65 + j)} is empty.`);
          return;
        }
      }
    }

    try {
      const payload: Partial<Quiz> = {
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        difficulty,
        durationMinutes: Number(durationMinutes),
        marksPerCorrect: Number(marksPerCorrect),
        negativeMarks: Number(negativeMarks),
        passingScore: Number(passingScore),
        instructions: instructions.trim(),
        isPublished,
        randomizeQuestions,
        questions,
      };

      if (editingQuizId) {
        await api.updateAdminQuiz(editingQuizId, payload);
        setMsg({ type: 'success', text: `Quiz "${title}" updated successfully.` });
      } else {
        await api.createAdminQuiz(payload);
        setMsg({ type: 'success', text: `Quiz "${title}" created and saved to MongoDB.` });
      }

      setIsEditorOpen(false);
      fetchQuizzes();
    } catch (err: any) {
      alert(err.message || 'Failed to save quiz.');
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-amber-400" />
            <span>Quiz & Question Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Author collegiate examinations, configure negative marking, and publish to the live student arena.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Quiz</span>
        </button>
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
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Quizzes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map((quiz) => (
          <div
            key={quiz._id}
            className="navy-card rounded-3xl p-6 border border-amber-500/20 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-amber-300 border border-amber-500/20">
                  {quiz.category}
                </span>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    quiz.isPublished
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {quiz.isPublished ? '● Published' : 'Draft'}
                </span>
              </div>

              <h3 className="text-base font-bold text-white mb-1">{quiz.title}</h3>
              <p className="text-xs text-slate-400 line-clamp-2">{quiz.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{quiz.durationMinutes} mins</span>
                </div>
                <div>{quiz.questions?.length || quiz.totalQuestions} Questions</div>
                <div>+{quiz.marksPerCorrect} / -{quiz.negativeMarks} marks</div>
                <div>Pass: {quiz.passingScore}%</div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleTogglePublish(quiz._id, quiz.isPublished)}
                    title={quiz.isPublished ? 'Unpublish quiz' : 'Publish quiz'}
                    className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 border transition-colors ${
                      quiz.isPublished
                        ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    {quiz.isPublished ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{quiz.isPublished ? 'Live' : 'Hidden'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditModal(quiz)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition-colors"
                    title="Edit quiz"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteQuiz(quiz._id, quiz.title)}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                    title="Delete quiz"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="navy-card max-w-4xl w-full rounded-3xl p-6 sm:p-8 border border-amber-500/40 shadow-2xl my-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <span>{editingQuizId ? 'Edit Quiz & Questions' : 'Create New College Quiz'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuiz} className="space-y-6">
              {/* Basic Config */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Quiz Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Operating Systems & Multithreading"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Subject / Category</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Computer Science, AI, Mechanical"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Overview of concepts evaluated in this quiz..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Rubric Settings */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    min={1}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Correct Mark</label>
                  <input
                    type="number"
                    min={1}
                    value={marksPerCorrect}
                    onChange={(e) => setMarksPerCorrect(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Negative Penalty</label>
                  <input
                    type="number"
                    min={0}
                    step={0.25}
                    value={negativeMarks}
                    onChange={(e) => setNegativeMarks(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Passing %</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={passingScore}
                    onChange={(e) => setPassingScore(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-4 text-xs text-slate-300">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="rounded border-amber-500 text-amber-500 w-4 h-4 bg-slate-900"
                  />
                  <span>Publish immediately to Student Arena</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={randomizeQuestions}
                    onChange={(e) => setRandomizeQuestions(e.target.checked)}
                    className="rounded border-amber-500 text-amber-500 w-4 h-4 bg-slate-900"
                  />
                  <span>Randomize question sequence per student</span>
                </label>
              </div>

              {/* Questions Section */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">
                    Questions ({questions.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-bold border border-amber-500/40 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Question</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {questions.map((q, qIdx) => (
                    <div
                      key={qIdx}
                      className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 relative"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <span className="text-xs font-bold text-amber-400 uppercase">
                          Question #{qIdx + 1}
                        </span>
                        {questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(qIdx)}
                            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>

                      <div>
                        <input
                          type="text"
                          required
                          placeholder="Enter question text..."
                          value={q.questionText}
                          onChange={(e) => {
                            const newQs = [...questions];
                            newQs[qIdx].questionText = e.target.value;
                            setQuestions(newQs);
                          }}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      {/* 4 Options */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {[0, 1, 2, 3].map((optIdx) => {
                          const letter = String.fromCharCode(65 + optIdx);
                          const isCorrect = q.correctOption === optIdx;
                          return (
                            <div key={optIdx} className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const newQs = [...questions];
                                  newQs[qIdx].correctOption = optIdx;
                                  setQuestions(newQs);
                                }}
                                title="Click to designate as correct answer"
                                className={`w-7 h-7 rounded-lg text-xs font-bold shrink-0 flex items-center justify-center cursor-pointer transition-colors ${
                                  isCorrect
                                    ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-400'
                                    : 'bg-slate-800 text-slate-400 hover:text-white'
                                }`}
                              >
                                {letter}
                              </button>
                              <input
                                type="text"
                                required
                                placeholder={`Option ${letter}`}
                                value={q.options[optIdx] || ''}
                                onChange={(e) => {
                                  const newQs = [...questions];
                                  newQs[qIdx].options[optIdx] = e.target.value;
                                  setQuestions(newQs);
                                }}
                                className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none"
                              />
                            </div>
                          );
                        })}
                      </div>

                      <div>
                        <input
                          type="text"
                          placeholder="Explanation (shown to student after quiz is evaluated)..."
                          value={q.explanation || ''}
                          onChange={(e) => {
                            const newQs = [...questions];
                            newQs[qIdx].explanation = e.target.value;
                            setQuestions(newQs);
                          }}
                          className="w-full px-3 py-1.5 bg-slate-900/60 border border-slate-800 rounded-lg text-xs text-slate-300 placeholder-slate-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Quiz to Database</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
