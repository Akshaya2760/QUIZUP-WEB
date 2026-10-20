import React, { useState, useEffect } from 'react';

interface AnimatedMascotProps {
  mode: 'login' | 'signup' | 'admin' | 'welcome';
  customMessage?: string;
  isSubmitting?: boolean;
  hasError?: boolean;
}

export function AnimatedMascot({
  mode,
  customMessage,
  isSubmitting = false,
  hasError = false,
}: AnimatedMascotProps) {
  const [speechText, setSpeechText] = useState('');
  const [isWaving, setIsWaving] = useState(true);

  useEffect(() => {
    if (customMessage) {
      setSpeechText(customMessage);
      return;
    }

    if (hasError) {
      setSpeechText("Hmm, let's double check those details! You've got this! ✨");
      return;
    }

    if (isSubmitting) {
      setSpeechText("Verifying credentials with the university server... 📡");
      return;
    }

    switch (mode) {
      case 'signup':
        setSpeechText("Welcome future champion! Register now to compete for the College Cup! 🏆");
        break;
      case 'admin':
        setSpeechText("Greetings, Administrator! Campus quiz controls ready for your directive. 🎓");
        break;
      case 'welcome':
        setSpeechText("Hello scholar! Welcome to QUIZUP! Ready to test your mastery? 🌟");
        break;
      case 'login':
      default:
        setSpeechText("Hello scholar! Welcome back to QUIZUP! Good luck with today's challenges! 💡");
        break;
    }
  }, [mode, customMessage, isSubmitting, hasError]);

  useEffect(() => {
    const waveInterval = setInterval(() => {
      setIsWaving((prev) => !prev);
    }, 2800);
    return () => clearInterval(waveInterval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center mb-4 select-none">
      {/* Speech Bubble */}
      <div className="relative mb-3 max-w-xs sm:max-w-sm px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500/15 to-yellow-500/10 border border-amber-500/30 text-amber-200 text-xs sm:text-sm font-medium shadow-lg backdrop-blur-md text-center animate-bounce-subtle">
        <p className="flex items-center justify-center gap-1.5 leading-relaxed">
          {speechText}
        </p>
        {/* Tail of speech bubble */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-r border-b border-amber-500/30 rotate-45"></div>
      </div>

      {/* Animated Owl Scholar Mascot */}
      <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
        {/* Glowing aura */}
        <div className="absolute inset-0 rounded-full bg-amber-500/15 blur-xl animate-pulse"></div>

        <svg
          viewBox="0 0 160 160"
          className="w-full h-full drop-shadow-[0_10px_20px_rgba(245,158,11,0.25)] transition-transform duration-300 hover:scale-105"
        >
          {/* Owl Body */}
          <ellipse
            cx="80"
            cy="95"
            rx="46"
            ry="48"
            className="fill-slate-900 stroke-amber-500/60"
            strokeWidth="3"
          />

          {/* Golden Belly Patch */}
          <ellipse
            cx="80"
            cy="102"
            rx="30"
            ry="32"
            className="fill-amber-500/10 stroke-amber-400/30"
            strokeWidth="1.5"
          />

          {/* Belly Feather Feathers */}
          <path
            d="M 68 95 Q 80 102 92 95 M 70 106 Q 80 114 90 106"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.6"
          />

          {/* Left Wing (Waving) */}
          <g
            style={{
              transformOrigin: '40px 85px',
              transform: isWaving ? 'rotate(-24deg)' : 'rotate(-6deg)',
              transition: 'transform 0.45s ease-in-out',
            }}
          >
            <path
              d="M 40 80 C 18 80, 16 112, 38 122 C 44 116, 46 95, 40 80 Z"
              fill="#0f172a"
              stroke="#f59e0b"
              strokeWidth="2.5"
            />
            {/* Wing gold trim */}
            <circle cx="28" cy="98" r="3" fill="#f59e0b" opacity="0.8" />
          </g>

          {/* Right Wing (Resting) */}
          <path
            d="M 120 80 C 142 80, 144 112, 122 122 C 116 116, 114 95, 120 80 Z"
            fill="#0f172a"
            stroke="#f59e0b"
            strokeWidth="2.5"
          />

          {/* Big Scholar Eyes - Outer White */}
          <circle cx="62" cy="74" r="17" fill="#f8fafc" stroke="#f59e0b" strokeWidth="2" />
          <circle cx="98" cy="74" r="17" fill="#f8fafc" stroke="#f59e0b" strokeWidth="2" />

          {/* Golden Iris */}
          <circle cx="63" cy="75" r="10" fill="#d97706" />
          <circle cx="97" cy="75" r="10" fill="#d97706" />

          {/* Pupils with catchlight */}
          <circle cx="64" cy="75" r="5.5" fill="#0f172a" />
          <circle cx="98" cy="75" r="5.5" fill="#0f172a" />
          <circle cx="62" cy="72" r="2.2" fill="#ffffff" />
          <circle cx="96" cy="72" r="2.2" fill="#ffffff" />

          {/* Scholar Glasses */}
          <circle cx="62" cy="74" r="18" fill="none" stroke="#fbbf24" strokeWidth="2.5" />
          <circle cx="98" cy="74" r="18" fill="none" stroke="#fbbf24" strokeWidth="2.5" />
          <path d="M 80 74 L 80 72" stroke="#fbbf24" strokeWidth="3" />

          {/* Cute Orange Beak */}
          <polygon points="80,85 73,94 87,94" fill="#f97316" stroke="#ea580c" strokeWidth="1" />

          {/* Academic Graduation Cap (Mortarboard) */}
          <g>
            {/* Cap Base */}
            <path d="M 62 46 C 62 40, 98 40, 98 46 L 94 52 L 66 52 Z" fill="#090d16" stroke="#f59e0b" strokeWidth="1.5" />
            {/* Diamond Board */}
            <polygon
              points="80,24 126,38 80,50 34,38"
              fill="#0f172a"
              stroke="#fbbf24"
              strokeWidth="2.5"
            />
            {/* Gold Button on Top */}
            <circle cx="80" cy="37" r="3.5" fill="#f59e0b" />
            {/* Gold Tassel dangling */}
            <path
              d="M 80 37 Q 106 42 110 58"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <rect x="108" y="58" width="5" height="9" rx="1.5" fill="#f59e0b" />
          </g>

          {/* Cute Little Feet */}
          <ellipse cx="68" cy="142" rx="6" ry="3.5" fill="#f97316" />
          <ellipse cx="92" cy="142" rx="6" ry="3.5" fill="#f97316" />
        </svg>

        {/* Small floating spark/star */}
        <div className="absolute -top-1 -right-1 text-amber-300 text-sm animate-ping opacity-75">
          ✦
        </div>
      </div>
    </div>
  );
}
