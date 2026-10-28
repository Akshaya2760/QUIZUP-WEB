import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { requireAuth } from '../middleware/auth.ts';

const router = Router();

// Fallback models in priority order to guarantee 100% resilience against 503 capacity spikes
const CANDIDATE_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash-lite',
];

// Initialize GoogleGenAI if key available
function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Executes a Gemini generateContent request with multi-model failover
 */
async function generateWithFallback(ai: GoogleGenAI, requestPayload: any) {
  let lastErr: any = null;
  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        ...requestPayload,
        model,
      });
      if (response && response.text) {
        return response;
      }
    } catch (err: any) {
      lastErr = err;
      const msg = String(err?.message || '');
      if (
        msg.includes('503') ||
        msg.includes('high demand') ||
        msg.includes('UNAVAILABLE') ||
        msg.includes('404')
      ) {
        console.warn(`[Gemini AI] Model ${model} returned high demand / 503, falling back to next candidate...`);
        continue;
      }
      throw err;
    }
  }
  throw lastErr || new Error('All candidate Gemini models are currently busy. Please try again in a few moments.');
}

// Ask question / Concept explanation
router.post('/ask', requireAuth, async (req: Request, res: Response) => {
  try {
    const { prompt, topic, context } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'MISSING_PROMPT', message: 'A prompt or question is required.' });
    }

    const ai = getGenAIClient();
    if (!ai) {
      return res.status(503).json({
        available: false,
        error: 'AI_KEY_NOT_CONFIGURED',
        message: 'Gemini AI Assistant is not currently configured. Please ensure GEMINI_API_KEY is configured in your server environment.',
      });
    }

    const systemInstruction = `You are "Professor Byte", an encouraging, brilliant AI College Quiz & Academic Study Assistant at QUIZUP.
Your role:
- Provide crystal-clear, structured explanations of computer science, engineering, mathematics, and academic quiz topics.
- Break down tricky questions step-by-step with intuitive analogies and formal proofs where relevant.
- Provide key takeaways and memory tips (mnemonics).
- Keep formatting clean with Markdown headers, bullet points, and code snippets where helpful.
${context ? `Context from student attempt: ${JSON.stringify(context)}` : ''}`;

    const response = await generateWithFallback(ai, {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemInstruction}\n\nTopic: ${topic || 'General'}\n\nQuestion / Request: ${prompt}` }],
        },
      ],
    });

    return res.json({
      available: true,
      answer: response.text || 'I could not generate an explanation at this time.',
    });
  } catch (err: any) {
    console.error('Gemini AI error (/ask):', err.message);
    return res.status(500).json({
      available: false,
      error: 'AI_GENERATION_FAILED',
      message: 'Failed to generate study advice. Please try again shortly.',
      detail: err.message,
    });
  }
});

// Explain a specific quiz question answer
router.post('/explain-question', requireAuth, async (req: Request, res: Response) => {
  try {
    const { questionText, options, selectedOption, correctOption, explanation, topic } = req.body;

    if (!questionText || !options) {
      return res.status(400).json({ error: 'MISSING_DATA' });
    }

    const ai = getGenAIClient();
    if (!ai) {
      return res.status(503).json({
        available: false,
        error: 'AI_KEY_NOT_CONFIGURED',
        message: 'Gemini AI Assistant is not configured on this instance.',
      });
    }

    const promptText = `Please analyze this college exam question:
Topic: ${topic || 'Academic & Engineering'}
Question: "${questionText}"
Options:
${options.map((opt: string, i: number) => `[Option ${String.fromCharCode(65 + i)}]: ${opt}`).join('\n')}

Student selected: ${selectedOption !== null && selectedOption !== undefined ? `Option ${String.fromCharCode(65 + selectedOption)}` : 'None (Unanswered)'}
Correct answer: Option ${String.fromCharCode(65 + correctOption)}
Existing brief note: ${explanation || 'None provided'}

Please provide:
1. Direct Explanation: Why Option ${String.fromCharCode(65 + correctOption)} is unequivocally correct.
2. Distractor Breakdown: Why each of the other options is incorrect or misleading.
3. Common Pitfall: What mistake causes students to choose the wrong option.
4. Quick Revision Rule: A 1-sentence mnemonic or rule of thumb to remember for future quizzes.`;

    const response = await generateWithFallback(ai, {
      contents: [{ role: 'user', parts: [{ text: promptText }] }],
    });

    return res.json({
      available: true,
      explanation: response.text,
    });
  } catch (err: any) {
    console.error('Gemini AI error (/explain-question):', err.message);
    return res.status(500).json({
      available: false,
      error: 'AI_EXPLAIN_FAILED',
      message: err.message,
    });
  }
});

// Generate practice questions on a topic
router.post('/generate-practice', requireAuth, async (req: Request, res: Response) => {
  try {
    const { topic, difficulty = 'medium', count = 3 } = req.body;

    const ai = getGenAIClient();
    if (!ai) {
      return res.status(503).json({
        available: false,
        error: 'AI_KEY_NOT_CONFIGURED',
        message: 'Gemini AI Assistant is not configured.',
      });
    }

    const promptText = `Generate ${count} challenging multiple-choice practice questions on the subject "${topic}" at "${difficulty}" college level.
Return strictly valid JSON array of objects with schema:
[
  {
    "questionText": "string",
    "options": ["string", "string", "string", "string"],
    "correctOption": 0,
    "explanation": "concise explanation of why this is correct"
  }
]
Do not include markdown triple backtick fences or extra text, just raw JSON.`;

    const response = await generateWithFallback(ai, {
      contents: [{ role: 'user', parts: [{ text: promptText }] }],
      config: {
        responseMimeType: 'application/json',
      },
    });

    let rawText = response.text || '[]';
    rawText = rawText.replace(/```json\n?/, '').replace(/```\n?/, '').trim();

    try {
      const parsed = JSON.parse(rawText);
      return res.json({ available: true, questions: parsed });
    } catch {
      return res.json({ available: true, raw: response.text });
    }
  } catch (err: any) {
    console.error('Gemini AI error (/generate-practice):', err.message);
    return res.status(500).json({ available: false, error: err.message });
  }
});

// Generate personalized study plan based on quiz history
router.post('/study-plan', requireAuth, async (req: Request, res: Response) => {
  try {
    const { history, studentName, department } = req.body;

    const ai = getGenAIClient();
    if (!ai) {
      return res.status(503).json({
        available: false,
        error: 'AI_KEY_NOT_CONFIGURED',
        message: 'Gemini AI Assistant is not configured.',
      });
    }

    const prompt = `Student ${studentName || 'Student'} (${department || 'Engineering'}) wants a 7-day targeted study revision plan based on their recent quiz performance:
${JSON.stringify(history, null, 2)}

Provide:
1. Performance Diagnosis: Key strengths and weak areas identified.
2. 7-Day Structured Day-by-Day Revision Schedule (Topics, High-Yield Concepts, Practice Drills).
3. Exam-day psychological tips for speed and accuracy in competitive college quizzes.`;

    const response = await generateWithFallback(ai, {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    return res.json({ available: true, plan: response.text });
  } catch (err: any) {
    console.error('Gemini AI error (/study-plan):', err.message);
    return res.status(500).json({ available: false, error: err.message });
  }
});

// Interactive Gemini Chatbot endpoint ("Gemini Chat Boat")
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'MISSING_MESSAGE', message: 'Message is required.' });
    }

    const ai = getGenAIClient();
    if (!ai) {
      return res.status(503).json({
        available: false,
        error: 'AI_KEY_NOT_CONFIGURED',
        message: 'Gemini AI Chatbot is not configured on this server.',
      });
    }

    const systemInstruction = `You are "Byte AI", the official interactive Gemini Chatbot for QUIZUP College Quiz & Academic Competition Platform.
Your mission:
- Help collegiate students excel in academic quizzes, computer science, software engineering, mathematics, physics, and technical competitive exams.
- If a student asks for practice questions, provide clear multiple-choice questions with 4 options and reveal the answer when they guess or ask.
- Explain challenging concepts in simple, memorable terms with analogies, diagrams (in ascii/markdown), and key bullet points.
- Provide encouragement, study motivation, exam-taking tips, and time-management advice.
- Keep responses friendly, energetic, collegiate, formatted with clean Markdown (bolding, lists, and code blocks).`;

    // Build contents from optional history
    const contents: any[] = [];
    if (Array.isArray(history) && history.length > 0) {
      for (const turn of history.slice(-8)) {
        if (turn.role === 'user' || turn.role === 'model') {
          contents.push({
            role: turn.role,
            parts: [{ text: String(turn.text || turn.message || '') }],
          });
        }
      }
    }

    contents.push({
      role: 'user',
      parts: [{ text: message.trim() }],
    });

    const response = await generateWithFallback(ai, {
      contents,
      config: {
        systemInstruction,
      },
    });

    return res.json({
      available: true,
      reply: response.text || 'I am thinking, but could not formulate a response at this moment.',
    });
  } catch (err: any) {
    console.error('Gemini Chat error (/chat):', err.message);
    return res.status(500).json({
      available: false,
      error: 'CHAT_FAILED',
      message: err.message || 'Gemini chatbot failed to reply.',
    });
  }
});

export default router;
