import React, { useState } from 'react';
import {
  BrainCircuit,
  Sparkles,
  BookOpen,
  Send,
  HelpCircle,
  FileQuestion,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  X,
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export function AiStudyAssistantPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'chat' | 'practice' | 'plan'>('chat');

  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello ${user?.name || 'Scholar'}! 🎓 I am your **QUIZUP AI Study Mentor**, powered by Google Gemini.
I can help break down difficult computer science algorithms, explain exam answers, generate custom practice quizzes, or map out an accelerated study plan.

What concept or quiz topic would you like to master today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Practice state
  const [practiceTopic, setPracticeTopic] = useState('Data Structures & Algorithms');
  const [practiceDifficulty, setPracticeDifficulty] = useState('medium');
  const [practiceCount, setPracticeCount] = useState(3);
  const [isGeneratingPractice, setIsGeneratingPractice] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);

  // Study plan state
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [studyPlanResult, setStudyPlanResult] = useState<string | null>(null);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim() || isAsking) return;

    const userMsg: Message = {
      role: 'user',
      content: inputPrompt.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsAsking(true);
    setAiError(null);

    try {
      const res = await api.askAi({ prompt: userMsg.content, topic: user?.department });
      if (res.available && res.answer) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: res.answer || '',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        setAiError(res.message || 'Gemini API is not configured or reached quota limits.');
      }
    } catch (err: any) {
      const errMsg = err?.message || '';
      if (errMsg.includes('500') || errMsg.includes('503') || errMsg.includes('demand')) {
        setAiError('The AI model experienced a brief network demand spike. Multi-model failover has engaged—please tap "Ask Professor Byte" again to get your answer.');
      } else {
        setAiError(errMsg || 'Failed to generate study advice. Please try again.');
      }
    } finally {
      setIsAsking(false);
    }
  };

  const handleGeneratePractice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingPractice(true);
    setAiError(null);
    try {
      const res = await api.generatePracticeAi({
        topic: practiceTopic,
        difficulty: practiceDifficulty,
        count: practiceCount,
      });

      if (res.available && res.questions) {
        setGeneratedQuestions(res.questions);
      } else {
        setAiError(res.error || 'Could not generate questions. Please ensure GEMINI_API_KEY is configured.');
      }
    } catch (err: any) {
      setAiError(err.message);
    } finally {
      setIsGeneratingPractice(false);
    }
  };

  const handleGeneratePlan = async () => {
    setIsGeneratingPlan(true);
    setAiError(null);
    try {
      const historyRes = await api.getMyHistory();
      const res = await api.generateStudyPlanAi({
        history: historyRes.history || [],
        studentName: user?.name || 'Student',
        department: user?.department || 'Engineering',
      });

      if (res.available && res.plan) {
        setStudyPlanResult(res.plan);
      } else {
        setAiError('Could not generate study plan.');
      }
    } catch (err: any) {
      setAiError(err.message);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" /> Powered by Google Gemini
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white flex items-center gap-3">
          <BrainCircuit className="w-8 h-8 text-amber-400" />
          <span>AI Study Mentor</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Personalized concept tutoring, practice problem generation, and adaptive revision schedules.
        </p>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 p-1 rounded-2xl bg-[#0d152c]/90 border border-amber-500/20 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('chat')}
          className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'chat'
              ? 'bg-amber-500 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Concept Q&A</span>
        </button>

        <button
          onClick={() => setActiveTab('practice')}
          className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'practice'
              ? 'bg-amber-500 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileQuestion className="w-4 h-4" />
          <span>Practice Generator</span>
        </button>

        <button
          onClick={() => setActiveTab('plan')}
          className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'plan'
              ? 'bg-amber-500 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Adaptive Study Plan</span>
        </button>
      </div>

      {aiError && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300">Notice about Gemini AI Assistant:</p>
              <p className="text-[11px] mt-0.5 text-slate-300">{aiError}</p>
            </div>
          </div>
          <button
            onClick={() => setAiError(null)}
            className="p-1 hover:bg-amber-500/20 rounded-lg text-amber-400 hover:text-white transition-colors cursor-pointer"
            title="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TAB 1: Chat Q&A */}
      {activeTab === 'chat' && (
        <div className="navy-card rounded-3xl border border-amber-500/20 flex flex-col h-[580px] shadow-2xl overflow-hidden">
          {/* Chat Messages Log */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {messages.map((msg, i) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <div
                  key={i}
                  className={`flex gap-3 max-w-[85%] ${
                    isAssistant ? 'self-start' : 'self-end ml-auto flex-row-reverse'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs shrink-0 ${
                      isAssistant
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-slate-800 text-white border border-slate-700'
                    }`}
                  >
                    {isAssistant ? <BrainCircuit className="w-4 h-4" /> : user?.name.charAt(0).toUpperCase()}
                  </div>

                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isAssistant
                        ? 'bg-slate-950/80 border border-slate-800 text-slate-200 shadow-md whitespace-pre-line'
                        : 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-medium'
                    }`}
                  >
                    {msg.content}
                    <span
                      className={`block text-[10px] mt-2 font-mono ${
                        isAssistant ? 'text-slate-500' : 'text-slate-800'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {isAsking && (
              <div className="flex gap-3 self-start">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
                  <BrainCircuit className="w-4 h-4 animate-spin" />
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-amber-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                  <span>Professor Byte is crafting an explanation...</span>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-950/80 flex gap-2">
            <input
              type="text"
              placeholder="Ask anything (e.g. 'Explain Dijkstra vs A* search algorithm', 'Why is QuickSort O(n^2)?')..."
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              disabled={isAsking || !inputPrompt.trim()}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <span>Ask</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: Practice Question Generator */}
      {activeTab === 'practice' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-[#0d152c]/90 border border-amber-500/20 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileQuestion className="w-4 h-4 text-amber-400" />
              <span>Generate AI Practice Drills</span>
            </h3>

            <form onSubmit={handleGeneratePractice} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Subject / Specific Topic</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Binary Search Trees, Virtual Memory, Database Normalization"
                  value={practiceTopic}
                  onChange={(e) => setPracticeTopic(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Difficulty</label>
                <select
                  value={practiceDifficulty}
                  onChange={(e) => setPracticeDifficulty(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="easy">Easy (Fundamentals)</option>
                  <option value="medium">Medium (College Level)</option>
                  <option value="hard">Hard (Advanced Competitive)</option>
                </select>
              </div>

              <div className="sm:col-span-3 pt-2">
                <button
                  type="submit"
                  disabled={isGeneratingPractice}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isGeneratingPractice ? 'Synthesizing Questions...' : 'Generate Practice Questions'}</span>
                </button>
              </div>
            </form>
          </div>

          {generatedQuestions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white">Generated Practice Questions:</h3>
              {generatedQuestions.map((q, idx) => (
                <div key={idx} className="navy-card rounded-2xl p-5 border border-amber-500/20 space-y-3">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                    Practice Drill #{idx + 1}
                  </span>
                  <p className="text-sm font-semibold text-white">{q.questionText}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {q.options?.map((opt: string, optIdx: number) => {
                      const isCorrect = q.correctOption === optIdx;
                      return (
                        <div
                          key={optIdx}
                          className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                            isCorrect
                              ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300 font-semibold'
                              : 'bg-slate-950/80 border-slate-800 text-slate-300'
                          }`}
                        >
                          <span className="w-5 h-5 rounded bg-black/40 flex items-center justify-center font-bold text-[10px]">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span>{opt}</span>
                          {isCorrect && <span className="ml-auto text-[10px] text-emerald-400 font-bold">✓ Correct</span>}
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
                      <span className="font-bold text-amber-300">Explanation: </span>
                      {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Adaptive Study Plan */}
      {activeTab === 'plan' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-[#0d152c]/90 border border-amber-500/20 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Personalized Revision Roadmap</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Gemini will inspect your historical quiz accuracy, missed concepts, and department curriculum to
              synthesize a tailored 7-day revision schedule.
            </p>

            <button
              onClick={handleGeneratePlan}
              disabled={isGeneratingPlan}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md disabled:opacity-50"
            >
              <Lightbulb className="w-4 h-4" />
              <span>{isGeneratingPlan ? 'Synthesizing 7-Day Plan...' : 'Generate My Study Schedule'}</span>
            </button>
          </div>

          {studyPlanResult && (
            <div className="navy-card rounded-3xl p-6 sm:p-8 border border-amber-500/30 text-xs text-slate-200 whitespace-pre-line leading-relaxed shadow-2xl">
              {studyPlanResult}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
