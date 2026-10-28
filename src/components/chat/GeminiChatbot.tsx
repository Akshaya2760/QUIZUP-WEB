import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  RotateCcw,
  Minimize2,
  Maximize2,
  ChevronDown,
  BookOpen,
  HelpCircle,
  Brain,
  Lightbulb,
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  '⚡ Test me with a 1-question quiz challenge',
  '🌳 Explain Binary Search Trees with an analogy',
  '⏱️ Tips to manage time during high-speed college quizzes',
  '💾 Explain Database Normalization (1NF, 2NF, 3NF)',
  '⚙️ Difference between Process vs Thread in OS',
];

export function GeminiChatbot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hello ${user ? user.name.split(' ')[0] : 'Scholar'}! 👋 I am **Byte AI**, your official Gemini-powered collegiate study assistant.

Ask me to explain complex topics, test your knowledge with instant practice questions, or guide your exam strategy! How can I help you today?`,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Build history for context
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .slice(-6)
        .map((m) => ({
          role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
          text: m.text,
        }));

      const res = await api.chatWithAi({
        message: text,
        history,
      });

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: res.reply || 'I am ready to help you with your next quiz question or academic concept.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: `⚠️ ${err.message || 'I had trouble connecting to the Gemini server. Please try asking again in a moment.'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'ai',
        text: `Chat cleared! What academic subject or quiz preparation topic would you like to explore next?`,
        timestamp: new Date(),
      },
    ]);
  };

  // Render markdown-like text safely
  const formatAiMessage = (content: string) => {
    // Split into paragraphs / lines
    const lines = content.split('\n');
    return lines.map((line, i) => {
      // Bold rendering
      let processed = line;
      
      // If code block header or inside
      if (line.startsWith('```')) {
        return (
          <div key={i} className="my-1.5 px-3 py-1.5 rounded-lg bg-slate-950 font-mono text-[11px] text-amber-300 overflow-x-auto border border-slate-800">
            {line.replace(/```[a-z]*/, '')}
          </div>
        );
      }

      // Headers
      if (line.startsWith('### ')) {
        return <h4 key={i} className="text-xs font-bold text-amber-300 mt-2 mb-1">{line.replace('### ', '')}</h4>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={i} className="text-sm font-extrabold text-amber-400 mt-2 mb-1">{line.replace('## ', '')}</h3>;
      }

      // Bullet points
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <div key={i} className="flex items-start gap-1.5 my-0.5 text-xs">
            <span className="text-amber-400 font-black">•</span>
            <span>{renderFormattedInline(line.slice(2))}</span>
          </div>
        );
      }

      return (
        <p key={i} className="text-xs my-1 leading-relaxed">
          {renderFormattedInline(line)}
        </p>
      );
    });
  };

  const renderFormattedInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={index} className="px-1 py-0.5 rounded bg-slate-900 text-amber-300 font-mono text-[11px] border border-slate-800">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs shadow-[0_0_25px_rgba(245,158,11,0.45)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <div className="w-6 h-6 rounded-full bg-slate-950/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-slate-950 animate-spin-slow" />
          </div>
          <span className="font-display font-extrabold tracking-wide">Gemini Chatbot</span>
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-950 animate-ping"></span>
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-950"></span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`w-[92vw] sm:w-[410px] bg-[#090e23] border border-amber-500/30 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden transition-all duration-300 backdrop-blur-xl ${
            isMinimized ? 'h-14' : 'h-[530px]'
          }`}
        >
          {/* Header */}
          <div className="p-3.5 px-4 bg-gradient-to-r from-[#0f1738] via-[#090e23] to-[#121c44] border-b border-amber-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 font-black shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-display font-black text-white flex items-center gap-1.5">
                  <span>Gemini Study Chatbot</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                </h3>
                <p className="text-[10px] text-amber-400/80 font-medium">
                  24/7 Academic Mentor & Quiz Coach
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button
                onClick={handleClearChat}
                title="Clear conversation"
                className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? 'Expand chat' : 'Minimize chat'}
                className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="p-1.5 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body Content (Hidden if minimized) */}
          {!isMinimized && (
            <>
              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-800">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {m.sender === 'ai' && (
                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[82%] rounded-2xl p-3 text-xs shadow-md ${
                        m.sender === 'user'
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-medium rounded-br-none'
                          : 'bg-slate-900/90 text-slate-200 border border-slate-800 rounded-bl-none'
                      }`}
                    >
                      {m.sender === 'ai' ? formatAiMessage(m.text) : <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>}
                      <span
                        className={`text-[9px] mt-1 block opacity-60 text-right ${
                          m.sender === 'user' ? 'text-slate-900' : 'text-slate-400'
                        }`}
                      >
                        {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {m.sender === 'user' && (
                      <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                        {user ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-2.5 items-center">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 animate-spin-slow" />
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-amber-400/90 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:0.4s]"></div>
                      <span className="text-[11px] ml-1 text-slate-400">Gemini is thinking...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts Carousel */}
              {messages.length <= 2 && !isLoading && (
                <div className="px-3 py-1.5 border-t border-slate-800/60 bg-[#070b19] overflow-x-auto flex gap-1.5 no-scrollbar">
                  {QUICK_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(prompt.replace(/^[^\w]+/, ''))}
                      className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-[10px] text-amber-300/90 whitespace-nowrap border border-amber-500/20 transition-all shrink-0 cursor-pointer"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              {/* Input Area */}
              <div className="p-3 border-t border-amber-500/15 bg-slate-950/80">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="Ask Gemini a doubt, quiz concept, or study tip..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    className="w-full pl-3.5 pr-11 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 disabled:opacity-50"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputValue.trim() || isLoading}
                    className="absolute right-1.5 p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all cursor-pointer disabled:opacity-40 disabled:hover:bg-amber-500"
                    title="Send message"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
