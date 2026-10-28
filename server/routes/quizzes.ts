import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { GoogleGenAI } from '@google/genai';
import { Quiz, IQuiz } from '../models/Quiz.ts';
import { Attempt } from '../models/Attempt.ts';
import { User } from '../models/User.ts';
import { AuditLog } from '../models/AuditLog.ts';
import {
  ensureDbConnected,
  requireAuth,
  requireAdmin,
  requireApprovedStudent,
} from '../middleware/auth.ts';

const router = Router();

// ==========================================
// SEED INITIAL SAMPLE QUIZZES (if DB empty)
// ==========================================
const DEFAULT_SAMPLE_QUIZZES = [
  {
    title: 'Data Structures & Algorithms Championship',
    description: 'Test your algorithmic proficiency across asymptotic complexity, trees, graphs, and dynamic programming.',
    category: 'Computer Science',
    difficulty: 'medium',
    durationMinutes: 10,
    totalQuestions: 5,
    marksPerCorrect: 4,
    negativeMarks: 1,
    passingScore: 50,
    instructions: 'Each question carries 4 marks. Incorrect answers incur 1 negative mark. Once submitted, answers cannot be edited.',
    isPublished: true,
    randomizeQuestions: false,
    questions: [
      {
        questionText: 'What is the worst-case time complexity of searching for an element in a balanced Binary Search Tree (AVL or Red-Black)?',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
        correctOption: 1,
        explanation: 'In a self-balancing BST with n nodes, the height is strictly bounded by O(log n), making lookup, insertion, and deletion O(log n) in the worst case.',
        marks: 4,
        difficulty: 'medium',
      },
      {
        questionText: 'Which graph traversal algorithm uses a First-In-First-Out (FIFO) queue data structure?',
        options: ['Depth-First Search (DFS)', 'Breadth-First Search (BFS)', 'Dijkstra Algorithm with Min-Heap', 'Kruskal Algorithm'],
        correctOption: 1,
        explanation: 'Breadth-First Search (BFS) explores vertices level-by-level using a standard FIFO queue.',
        marks: 4,
        difficulty: 'easy',
      },
      {
        questionText: 'In Dynamic Programming, what are the two essential characteristics a problem must exhibit?',
        options: [
          'Greedy choice property & Divide-and-conquer',
          'Optimal substructure & Overlapping subproblems',
          'Recursion tree & Memoization table',
          'Linear ordering & State compression',
        ],
        correctOption: 1,
        explanation: 'Dynamic Programming applies when a problem has optimal substructure (optimal solution contains optimal sub-solutions) and overlapping subproblems.',
        marks: 4,
        difficulty: 'medium',
      },
      {
        questionText: 'What is the average and worst-case space complexity of QuickSort when using standard recursive partitioning?',
        options: ['O(1) average, O(n) worst', 'O(log n) average, O(n) worst', 'O(n) average, O(n) worst', 'O(n log n) average, O(n^2) worst'],
        correctOption: 1,
        explanation: 'QuickSort is in-place for the array elements, but call-stack frames take O(log n) space on average and O(n) in the worst case (unbalanced splits).',
        marks: 4,
        difficulty: 'hard',
      },
      {
        questionText: 'Which data structure is ideal for implementing an LRU (Least Recently Used) cache with O(1) get and put operations?',
        options: [
          'Binary Heap + Array',
          'Doubly Linked List + Hash Map',
          'Trie + Stack',
          'Self-balancing Red-Black Tree',
        ],
        correctOption: 1,
        explanation: 'A Hash Map provides O(1) key lookups, while a Doubly Linked List allows O(1) removal and insertion of the most/least recently used nodes.',
        marks: 4,
        difficulty: 'medium',
      },
    ],
  },
  {
    title: 'Modern Web Architectures & Cloud Computing',
    description: 'Covers RESTful microservices, HTTP/2 & 3, Docker containerization, and modern frontend paradigms.',
    category: 'Information Technology',
    difficulty: 'easy',
    durationMinutes: 8,
    totalQuestions: 4,
    marksPerCorrect: 2,
    negativeMarks: 0,
    passingScore: 50,
    instructions: 'No negative marking. Answer all 4 questions before the 8-minute countdown finishes.',
    isPublished: true,
    randomizeQuestions: false,
    questions: [
      {
        questionText: 'What HTTP status code represents a "401 Unauthorized" vs "403 Forbidden"?',
        options: [
          '401 means authentication is missing/invalid; 403 means authenticated but lacking permissions.',
          '401 means forbidden; 403 means server crashed.',
          '401 is client error; 403 is internal proxy redirect.',
          'They are identical and interchangeable per RFC 7231.',
        ],
        correctOption: 0,
        explanation: '401 Unauthorized signifies that credentials are required or failed. 403 Forbidden indicates the server understands who you are, but you lack rights.',
        marks: 2,
        difficulty: 'easy',
      },
      {
        questionText: 'Which protocol does HTTP/3 utilize as its underlying transport layer instead of TCP?',
        options: ['UDP via QUIC', 'SCTP over TLS', 'WebSockets', 'Raw ICMP packets'],
        correctOption: 0,
        explanation: 'HTTP/3 uses QUIC (Quick UDP Internet Connections) over UDP to eliminate head-of-line blocking and achieve faster 0-RTT handshakes.',
        marks: 2,
        difficulty: 'medium',
      },
      {
        questionText: 'In container architecture, how does Docker container virtualization differ fundamentally from a Hypervisor Virtual Machine?',
        options: [
          'Containers virtualize hardware; VMs virtualize OS.',
          'Containers share the host OS kernel and isolate user spaces; VMs run full guest operating systems.',
          'VMs are lighter and boot in milliseconds; containers take minutes.',
          'Containers cannot access networking layers.',
        ],
        correctOption: 1,
        explanation: 'Containers share the host operating system kernel using namespaces and cgroups, making them much lighter and faster than VMs that emulate guest kernels.',
        marks: 2,
        difficulty: 'medium',
      },
      {
        questionText: 'Which browser storage mechanism has the highest capacity and supports transactional asynchronous key-value object stores?',
        options: ['Cookies', 'sessionStorage', 'localStorage', 'IndexedDB'],
        correctOption: 3,
        explanation: 'IndexedDB is a full client-side transactional database supporting several hundred megabytes or gigabytes of structured cloneable data.',
        marks: 2,
        difficulty: 'easy',
      },
    ],
  },
  {
    title: 'Computer Systems, OS & Networking Essentials',
    description: 'Core concepts in virtual memory, CPU scheduling, TCP handshakes, and process synchronization.',
    category: 'Computer Science',
    difficulty: 'hard',
    durationMinutes: 12,
    totalQuestions: 4,
    marksPerCorrect: 5,
    negativeMarks: 1,
    passingScore: 60,
    instructions: 'Negative marking enabled (+5 for correct, -1 for wrong). Passing threshold is 60%.',
    isPublished: true,
    randomizeQuestions: false,
    questions: [
      {
        questionText: 'Which of the following conditions is NOT required for a deadlock to occur (Coffman conditions)?',
        options: ['Mutual Exclusion', 'Hold and Wait', 'Preemption Allowed', 'Circular Wait'],
        correctOption: 2,
        explanation: 'No preemption is the condition. If preemption is allowed, resources can be reclaimed and deadlocks can be broken or prevented.',
        marks: 5,
        difficulty: 'medium',
      },
      {
        questionText: 'In a 3-way TCP handshake, what flags are sent in sequence by Client and Server?',
        options: [
          'SYN -> SYN-ACK -> ACK',
          'ACK -> SYN -> FIN',
          'SYN -> ACK -> DATA',
          'RST -> SYN -> ACK',
        ],
        correctOption: 0,
        explanation: 'The standard TCP 3-way handshake begins with client SYN, followed by server SYN-ACK, and finalized by client ACK.',
        marks: 5,
        difficulty: 'easy',
      },
      {
        questionText: 'What hardware component accelerates Virtual Address to Physical Address translation in modern CPUs?',
        options: ['Translation Lookaside Buffer (TLB)', 'Direct Memory Access (DMA) Controller', 'Arithmetic Logic Unit (ALU)', 'Instruction Register (IR)'],
        correctOption: 0,
        explanation: 'The TLB is an associative hardware memory cache that stores recent page-table virtual-to-physical address mappings.',
        marks: 5,
        difficulty: 'medium',
      },
      {
        questionText: 'What synchronization primitive allows multiple concurrent readers but gives exclusive access to writers?',
        options: ['Binary Spinlock', 'Counting Semaphore', 'Reader-Writer Lock (RWLock)', 'Peterson Algorithm'],
        correctOption: 2,
        explanation: 'A Reader-Writer Lock allows concurrent non-blocking read access for shared data while enforcing strict mutual exclusion during write modifications.',
        marks: 5,
        difficulty: 'hard',
      },
    ],
  },
];

// Seed sample quizzes if needed
export async function seedSampleQuizzesIfEmpty() {
  try {
    const count = await Quiz.countDocuments();
    if (count === 0) {
      console.log('[Seed] Seeding sample college quizzes into QUIZUP database...');
      await Quiz.insertMany(DEFAULT_SAMPLE_QUIZZES);
      console.log('[Seed] Sample quizzes created successfully.');
    }
  } catch (err: any) {
    console.error('[Seed] Could not seed quizzes:', err.message);
  }
}

// ==========================================
// PUBLIC & STUDENT QUIZ ENDPOINTS
// ==========================================

// List published quizzes
router.get('/', ensureDbConnected, requireAuth, async (req: Request, res: Response) => {
  try {
    const { category, difficulty, search } = req.query;

    const query: any = { isPublished: true };

    if (category && category !== 'all') {
      query.category = category;
    }
    if (difficulty && difficulty !== 'all') {
      query.difficulty = difficulty;
    }
    if (search) {
      const searchRegex = new RegExp(String(search).trim(), 'i');
      query.$or = [{ title: searchRegex }, { description: searchRegex }, { category: searchRegex }];
    }

    const quizzes = await Quiz.find(query)
      .select('-questions.correctOption -questions.explanation')
      .sort({ createdAt: -1 });

    // Fetch user attempts to annotate status
    let userAttempts: any[] = [];
    if (req.session.userId) {
      userAttempts = await Attempt.find({
        studentId: req.session.userId,
      }).select('quizId status score totalPossibleMarks accuracyPercent isPassed startedAt submittedAt');
    }

    const attemptMap = new Map();
    userAttempts.forEach((att) => {
      attemptMap.set(att.quizId.toString(), att);
    });

    const enriched = quizzes.map((q) => {
      const att = attemptMap.get(q._id.toString());
      return {
        ...q.toObject(),
        myAttempt: att || null,
        totalQuestions: q.questions.length,
      };
    });

    return res.json({ quizzes: enriched });
  } catch (err: any) {
    console.error('List quizzes error:', err);
    return res.status(500).json({ error: 'FAILED_FETCH_QUIZZES', message: err.message });
  }
});

// Get single quiz instructions / details (Answers stripped)
router.get('/:id', ensureDbConnected, requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'INVALID_ID', message: 'Invalid quiz ID.' });
    }

    const quiz = await Quiz.findById(id).select('-questions.correctOption -questions.explanation');

    if (!quiz) {
      return res.status(404).json({ error: 'QUIZ_NOT_FOUND', message: 'Quiz not found.' });
    }

    // Check if user has an attempt
    let myAttempt = null;
    if (req.session.userId) {
      myAttempt = await Attempt.findOne({
        quizId: quiz._id,
        studentId: req.session.userId,
      }).sort({ createdAt: -1 });
    }

    return res.json({ quiz, myAttempt });
  } catch (err: any) {
    return res.status(500).json({ error: 'FAILED_FETCH_QUIZ', message: err.message });
  }
});

// START A QUIZ ATTEMPT (Strict student approval check)
router.post('/:id/start', ensureDbConnected, requireApprovedStudent, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findById(id);

    if (!quiz) {
      return res.status(404).json({ error: 'QUIZ_NOT_FOUND', message: 'Quiz not found.' });
    }

    if (!quiz.isPublished && req.session.role !== 'admin') {
      return res.status(403).json({ error: 'QUIZ_NOT_PUBLISHED', message: 'This quiz is not currently open.' });
    }

    const student = await User.findById(req.session.userId);
    if (!student) {
      return res.status(404).json({ error: 'USER_NOT_FOUND' });
    }

    // Check if an existing attempt is in progress or completed
    let existingAttempt = await Attempt.findOne({
      quizId: quiz._id,
      studentId: student._id,
    }).sort({ createdAt: -1 });

    if (existingAttempt) {
      if (existingAttempt.status === 'in_progress') {
        // Return existing in-progress attempt with sanitized questions
        const sanitizedQuestions = quiz.questions.map((q) => ({
          _id: q._id,
          questionText: q.questionText,
          options: q.options,
          marks: q.marks || quiz.marksPerCorrect,
          difficulty: q.difficulty,
        }));

        return res.json({
          attempt: existingAttempt,
          questions: sanitizedQuestions,
          serverTime: Date.now(),
        });
      }

      if (existingAttempt.status === 'submitted' || existingAttempt.status === 'timed_out') {
        return res.status(400).json({
          error: 'ALREADY_COMPLETED',
          message: 'You have already completed this quiz. Check your results on the results page.',
          attemptId: existingAttempt._id,
        });
      }
    }

    // Calculate total possible marks
    const totalPossibleMarks = quiz.questions.reduce(
      (sum, q) => sum + (q.marks || quiz.marksPerCorrect),
      0
    );

    // Create fresh attempt
    const newAttempt = await Attempt.create({
      quizId: quiz._id,
      quizTitle: quiz.title,
      quizCategory: quiz.category,
      studentId: student._id,
      studentName: student.name,
      studentEmail: student.email,
      studentDepartment: student.department,
      studentYear: student.yearOfStudy,
      answers: {},
      markedForReview: [],
      startedAt: new Date(),
      status: 'in_progress',
      totalPossibleMarks,
      score: 0,
      durationSeconds: 0,
    });

    // Sanitize questions: NEVER expose correctOption or explanation to active quiz takers
    let sanitizedQuestions = quiz.questions.map((q) => ({
      _id: q._id,
      questionText: q.questionText,
      options: q.options,
      marks: q.marks || quiz.marksPerCorrect,
      difficulty: q.difficulty,
    }));

    if (quiz.randomizeQuestions) {
      sanitizedQuestions = [...sanitizedQuestions].sort(() => Math.random() - 0.5);
    }

    return res.status(201).json({
      attempt: newAttempt,
      questions: sanitizedQuestions,
      serverTime: Date.now(),
    });
  } catch (err: any) {
    console.error('Start quiz error:', err);
    return res.status(500).json({ error: 'START_QUIZ_FAILED', message: err.message });
  }
});

// SAVE ANSWERS AS STUDENT PROGRESSES
router.put('/:id/attempts/:attemptId/save', ensureDbConnected, requireApprovedStudent, async (req: Request, res: Response) => {
  try {
    const { id, attemptId } = req.params;
    const { answers, markedForReview } = req.body;

    const attempt = await Attempt.findOne({
      _id: attemptId,
      quizId: id,
      studentId: req.session.userId,
    });

    if (!attempt) {
      return res.status(404).json({ error: 'ATTEMPT_NOT_FOUND' });
    }

    if (attempt.status !== 'in_progress') {
      return res.status(400).json({
        error: 'ATTEMPT_ALREADY_FINALIZED',
        message: 'This quiz attempt has already been submitted or closed.',
      });
    }

    if (answers && typeof answers === 'object') {
      attempt.answers = answers;
    }

    if (Array.isArray(markedForReview)) {
      attempt.markedForReview = markedForReview;
    }

    await attempt.save();

    return res.json({ message: 'Progress saved automatically.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'SAVE_PROGRESS_FAILED', message: err.message });
  }
});

// SUBMIT QUIZ - STRICT SERVER-SIDE CALCULATION
router.post('/:id/attempts/:attemptId/submit', ensureDbConnected, requireApprovedStudent, async (req: Request, res: Response) => {
  try {
    const { id, attemptId } = req.params;
    const { answers: finalAnswers } = req.body;

    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return res.status(404).json({ error: 'QUIZ_NOT_FOUND' });
    }

    const attempt = await Attempt.findOne({
      _id: attemptId,
      quizId: id,
      studentId: req.session.userId,
    });

    if (!attempt) {
      return res.status(404).json({ error: 'ATTEMPT_NOT_FOUND' });
    }

    if (attempt.status !== 'in_progress') {
      return res.status(400).json({
        error: 'ALREADY_SUBMITTED',
        message: 'This quiz attempt has already been submitted.',
        result: attempt,
      });
    }

    // Merge answers
    const answersRecord: Record<string, number> = finalAnswers || (attempt.answers ? Object.fromEntries(attempt.answers as any) : {});

    // Compute duration from startedAt to now
    const now = new Date();
    const durationMs = now.getTime() - new Date(attempt.startedAt).getTime();
    const durationSeconds = Math.max(1, Math.round(durationMs / 1000));

    // Verify time limit with a 30-second network grace window
    const allowedSeconds = quiz.durationMinutes * 60 + 30;
    let finalStatus: 'submitted' | 'timed_out' = 'submitted';
    if (durationSeconds > allowedSeconds) {
      finalStatus = 'timed_out';
    }

    // Server-side scoring against stored questions
    let totalScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    let totalPossibleMarks = 0;

    const questionResults = quiz.questions.map((q) => {
      const qIdStr = q._id.toString();
      const selected = answersRecord[qIdStr] !== undefined && answersRecord[qIdStr] !== null
        ? Number(answersRecord[qIdStr])
        : null;

      const marks = q.marks || quiz.marksPerCorrect;
      totalPossibleMarks += marks;

      let isCorrect = false;
      let marksAwarded = 0;

      if (selected === null || selected === undefined) {
        unansweredCount++;
      } else if (selected === q.correctOption) {
        isCorrect = true;
        correctCount++;
        marksAwarded = marks;
        totalScore += marks;
      } else {
        incorrectCount++;
        const neg = quiz.negativeMarks || 0;
        marksAwarded = -neg;
        totalScore -= neg;
      }

      return {
        questionId: qIdStr,
        questionText: q.questionText,
        options: q.options,
        selectedOption: selected,
        correctOption: q.correctOption,
        isCorrect,
        marksAwarded,
        explanation: q.explanation || '',
      };
    });

    // Clamp score to >= 0
    totalScore = Math.max(0, Math.round(totalScore * 100) / 100);

    const accuracyPercent =
      quiz.questions.length > 0
        ? Math.round((correctCount / quiz.questions.length) * 100)
        : 0;

    const scorePercent =
      totalPossibleMarks > 0 ? (totalScore / totalPossibleMarks) * 100 : 0;
    const isPassed = scorePercent >= quiz.passingScore;

    // Update attempt
    attempt.answers = answersRecord as any;
    attempt.status = finalStatus;
    attempt.submittedAt = now;
    attempt.durationSeconds = durationSeconds;
    attempt.score = totalScore;
    attempt.totalPossibleMarks = totalPossibleMarks;
    attempt.correctCount = correctCount;
    attempt.incorrectCount = incorrectCount;
    attempt.unansweredCount = unansweredCount;
    attempt.accuracyPercent = accuracyPercent;
    attempt.isPassed = isPassed;
    attempt.questionResults = questionResults;

    await attempt.save();

    // Reward badges to student if eligible
    const student = await User.findById(attempt.studentId);
    if (student) {
      if (!student.badges.includes('Quiz Finisher')) {
        student.badges.push('Quiz Finisher');
      }
      if (isPassed && !student.badges.includes('Honor Roll')) {
        student.badges.push('Honor Roll');
      }
      if (accuracyPercent === 100 && !student.badges.includes('Perfectionist')) {
        student.badges.push('Perfectionist');
      }
      await student.save();
    }

    return res.json({
      message: 'Quiz submitted and evaluated successfully!',
      result: attempt,
    });
  } catch (err: any) {
    console.error('Submit quiz error:', err);
    return res.status(500).json({ error: 'SUBMIT_QUIZ_FAILED', message: err.message });
  }
});

// ==========================================
// ADMINISTRATOR QUIZ MANAGEMENT ENDPOINTS
// ==========================================

// Admin: List all quizzes including drafts
router.get('/admin/all', ensureDbConnected, requireAdmin, async (req: Request, res: Response) => {
  try {
    const quizzes = await Quiz.find().sort({ createdAt: -1 });

    // Count attempts per quiz
    const attemptCounts = await Attempt.aggregate([
      {
        $group: {
          _id: '$quizId',
          count: { $sum: 1 },
          avgScore: { $avg: '$score' },
        },
      },
    ]);

    const countMap = new Map();
    attemptCounts.forEach((c) => {
      countMap.set(c._id.toString(), {
        count: c.count,
        avgScore: Math.round((c.avgScore || 0) * 10) / 10,
      });
    });

    const enriched = quizzes.map((q) => {
      const stats = countMap.get(q._id.toString()) || { count: 0, avgScore: 0 };
      return {
        ...q.toObject(),
        attemptsCount: stats.count,
        averageScore: stats.avgScore,
      };
    });

    return res.json({ quizzes: enriched });
  } catch (err: any) {
    return res.status(500).json({ error: 'ADMIN_FETCH_FAILED', message: err.message });
  }
});

// Admin: Auto-Generate Quiz by AI from topic and open to registered students
router.post('/admin/generate-ai-quiz', ensureDbConnected, requireAdmin, async (req: Request, res: Response) => {
  try {
    const {
      topic,
      questionCount = 5,
      difficulty = 'medium',
      category,
      durationMinutes,
      marksPerCorrect = 2,
      negativeMarks = 0,
      passingScore = 50,
      isPublished = true, // Default open immediately to registered students!
      instructions,
    } = req.body;

    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return res.status(400).json({ error: 'MISSING_TOPIC', message: 'A topic is required to generate the quiz.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
      return res.status(503).json({
        error: 'AI_KEY_NOT_CONFIGURED',
        message: 'Gemini AI API key is not configured on this server.',
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const count = Math.min(Math.max(Number(questionCount) || 5, 2), 20);
    const duration = Number(durationMinutes) || Math.max(Math.round(count * 2), 5);

    const promptText = `Generate a complete, high-quality college competition quiz on the academic topic: "${topic.trim()}".
Difficulty level: ${difficulty}.
Total questions required: ${count}.
Requested Category: ${category || 'Appropriate Engineering/Academic Category'}.

Output strictly a JSON object with this exact structure:
{
  "title": "A concise, engaging title for the quiz (under 60 chars)",
  "description": "2-3 sentences introducing the quiz scope, core topics tested, and relevance.",
  "category": "e.g. Computer Science, Information Technology, Mathematics, Electrical, Mechanical, Data Science, etc.",
  "instructions": "Clear examination instructions for students regarding timing and accuracy.",
  "questions": [
    {
      "questionText": "Clear, precise academic multiple-choice question",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctOption": 0,
      "explanation": "Clear explanation of why this answer is correct and why other choices are distractors.",
      "marks": ${marksPerCorrect},
      "difficulty": "${difficulty}"
    }
  ]
}

Important requirements:
- Exactly ${count} questions in the questions array.
- Each question MUST have exactly 4 plausible options.
- correctOption MUST be an integer between 0 and 3 (0 for first option, 1 for second, 2 for third, 3 for fourth).
- Questions must be factual, intellectually stimulating, and free of typos.
- Return ONLY valid raw JSON. Do not wrap in markdown or backticks.`;

    const candidateModels = [
      'gemini-3.5-flash',
      'gemini-3.8-flash',
      'gemini-flash-latest',
      'gemini-3.1-flash-lite',
      'gemini-3.5-flash-lite',
    ];
    let response: any = null;
    let lastErr: any = null;

    for (const model of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: [{ role: 'user', parts: [{ text: promptText }] }],
          config: {
            responseMimeType: 'application/json',
          },
        });
        if (response && response.text) {
          break;
        }
      } catch (err: any) {
        lastErr = err;
        const msg = String(err?.message || '');
        if (msg.includes('503') || msg.includes('high demand') || msg.includes('UNAVAILABLE')) {
          console.warn(`[Gemini AI Quiz] Model ${model} returned 503 high demand, attempting fallback...`);
          continue;
        }
        throw err;
      }
    }

    if (!response || !response.text) {
      throw lastErr || new Error('All candidate Gemini models failed to generate content.');
    }

    let rawText = response.text || '{}';
    rawText = rawText.replace(/```json\n?/, '').replace(/```\n?/, '').trim();

    let generatedData: any;
    try {
      generatedData = JSON.parse(rawText);
    } catch (e: any) {
      console.error('Failed to parse AI quiz JSON:', rawText);
      return res.status(500).json({
        error: 'AI_PARSE_FAILED',
        message: 'Gemini generated a response that could not be parsed as valid JSON. Please try again.',
      });
    }

    if (!generatedData.questions || !Array.isArray(generatedData.questions) || generatedData.questions.length === 0) {
      return res.status(500).json({
        error: 'INVALID_AI_QUESTIONS',
        message: 'AI did not return valid quiz questions. Please try again.',
      });
    }

    // Validate and sanitize questions
    const sanitizedQuestions = generatedData.questions.map((q: any, idx: number) => {
      const opts = Array.isArray(q.options) && q.options.length >= 4
        ? q.options.slice(0, 4).map((o: any) => String(o).trim())
        : ['Option A', 'Option B', 'Option C', 'Option D'];

      let correct = Number(q.correctOption);
      if (isNaN(correct) || correct < 0 || correct > 3) {
        correct = 0;
      }

      return {
        questionText: q.questionText?.trim() || `Question ${idx + 1} on ${topic.trim()}`,
        options: opts,
        correctOption: correct,
        explanation: q.explanation?.trim() || 'Correct answer verified by curriculum standards.',
        marks: Number(q.marks) || Number(marksPerCorrect) || 2,
        difficulty: q.difficulty || difficulty,
      };
    });

    const finalTitle = generatedData.title?.trim() || `${topic.trim()} Mastery Challenge`;
    const finalCategory = (category && category.trim()) || generatedData.category?.trim() || 'Computer Science';
    const finalDescription = generatedData.description?.trim() || `Comprehensive assessment on ${topic.trim()}.`;
    const finalInstructions = instructions?.trim() || generatedData.instructions?.trim() || `Complete all ${sanitizedQuestions.length} questions within ${duration} minutes.`;

    const createdQuiz = await Quiz.create({
      title: finalTitle,
      description: finalDescription,
      category: finalCategory,
      difficulty,
      durationMinutes: duration,
      totalQuestions: sanitizedQuestions.length,
      marksPerCorrect: Number(marksPerCorrect) || 2,
      negativeMarks: Number(negativeMarks) || 0,
      passingScore: Number(passingScore) || 50,
      instructions: finalInstructions,
      isPublished: Boolean(isPublished),
      randomizeQuestions: false,
      questions: sanitizedQuestions,
      createdBy: req.session.userId,
    });

    await AuditLog.create({
      action: 'QUIZ_AI_GENERATED',
      performedBy: req.session.userId,
      performedByName: req.session.name,
      details: `AI generated quiz "${createdQuiz.title}" on topic "${topic.trim()}" with ${sanitizedQuestions.length} questions (Published: ${createdQuiz.isPublished}).`,
      ip: req.ip || '',
    });

    return res.status(201).json({
      message: `✨ AI Quiz "${createdQuiz.title}" generated successfully and ${createdQuiz.isPublished ? 'opened to all registered students' : 'saved as draft'}!`,
      quiz: createdQuiz,
    });
  } catch (err: any) {
    console.error('AI Quiz Generation error:', err);
    return res.status(500).json({
      error: 'AI_QUIZ_GEN_FAILED',
      message: err.message || 'Failed to generate quiz with Gemini AI.',
    });
  }
});

// Admin: Create quiz
router.post('/admin/create', ensureDbConnected, requireAdmin, async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      category,
      difficulty,
      durationMinutes,
      marksPerCorrect,
      negativeMarks,
      passingScore,
      instructions,
      isPublished,
      randomizeQuestions,
      questions,
    } = req.body;

    if (!title || !description || !category || !questions || !Array.isArray(questions)) {
      return res.status(400).json({
        error: 'MISSING_FIELDS',
        message: 'Title, description, category, and questions array are required.',
      });
    }

    const created = await Quiz.create({
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      difficulty: difficulty || 'medium',
      durationMinutes: Number(durationMinutes) || 15,
      totalQuestions: questions.length,
      marksPerCorrect: Number(marksPerCorrect) || 1,
      negativeMarks: Number(negativeMarks) || 0,
      passingScore: Number(passingScore) || 50,
      instructions: instructions || 'Complete all questions before time runs out.',
      isPublished: Boolean(isPublished),
      randomizeQuestions: Boolean(randomizeQuestions),
      questions,
      createdBy: req.session.userId,
    });

    await AuditLog.create({
      action: 'QUIZ_CREATED',
      performedBy: req.session.userId,
      performedByName: req.session.name,
      details: `Created quiz "${created.title}" with ${questions.length} questions.`,
      ip: req.ip || '',
    });

    return res.status(201).json({ message: 'Quiz created successfully.', quiz: created });
  } catch (err: any) {
    console.error('Quiz creation error:', err);
    return res.status(500).json({ error: 'QUIZ_CREATION_FAILED', message: err.message });
  }
});

// Admin: Edit quiz
router.put('/admin/:id', ensureDbConnected, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.questions && Array.isArray(updateData.questions)) {
      updateData.totalQuestions = updateData.questions.length;
    }

    const updated = await Quiz.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) {
      return res.status(404).json({ error: 'QUIZ_NOT_FOUND' });
    }

    await AuditLog.create({
      action: 'QUIZ_UPDATED',
      performedBy: req.session.userId,
      performedByName: req.session.name,
      details: `Updated quiz "${updated.title}"`,
      ip: req.ip || '',
    });

    return res.json({ message: 'Quiz updated successfully.', quiz: updated });
  } catch (err: any) {
    return res.status(500).json({ error: 'QUIZ_UPDATE_FAILED', message: err.message });
  }
});

// Admin: Toggle publish
router.patch('/admin/:id/publish', ensureDbConnected, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isPublished } = req.body;

    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return res.status(404).json({ error: 'QUIZ_NOT_FOUND' });
    }

    quiz.isPublished = Boolean(isPublished);
    await quiz.save();

    await AuditLog.create({
      action: quiz.isPublished ? 'QUIZ_PUBLISHED' : 'QUIZ_UNPUBLISHED',
      performedBy: req.session.userId,
      performedByName: req.session.name,
      details: `${quiz.isPublished ? 'Published' : 'Unpublished'} quiz "${quiz.title}"`,
      ip: req.ip || '',
    });

    return res.json({ message: `Quiz is now ${quiz.isPublished ? 'published' : 'unpublished'}.`, quiz });
  } catch (err: any) {
    return res.status(500).json({ error: 'TOGGLE_PUBLISH_FAILED', message: err.message });
  }
});

// Admin: Delete quiz
router.delete('/admin/:id', ensureDbConnected, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findByIdAndDelete(id);

    if (!quiz) {
      return res.status(404).json({ error: 'QUIZ_NOT_FOUND' });
    }

    await AuditLog.create({
      action: 'QUIZ_DELETED',
      performedBy: req.session.userId,
      performedByName: req.session.name,
      details: `Deleted quiz "${quiz.title}"`,
      ip: req.ip || '',
    });

    return res.json({ message: 'Quiz deleted successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'DELETE_QUIZ_FAILED', message: err.message });
  }
});

export default router;
