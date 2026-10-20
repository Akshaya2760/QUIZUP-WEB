import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Attempt } from '../models/Attempt.ts';
import { Quiz } from '../models/Quiz.ts';
import { ensureDbConnected, requireAuth, requireAdmin } from '../middleware/auth.ts';

const router = Router();

// Get single attempt result (Must be the student who took it, or an admin)
router.get('/attempt/:id', ensureDbConnected, requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'INVALID_ID' });
    }

    const attempt = await Attempt.findById(id);
    if (!attempt) {
      return res.status(404).json({ error: 'ATTEMPT_NOT_FOUND', message: 'Result not found.' });
    }

    // Permission check
    if (req.session.role !== 'admin' && attempt.studentId.toString() !== req.session.userId) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'You can only view your own results.' });
    }

    // Fetch quiz to check settings
    const quiz = await Quiz.findById(attempt.quizId);

    // Calculate deterministic rank in this quiz
    const higherRankCount = await Attempt.countDocuments({
      quizId: attempt.quizId,
      status: { $in: ['submitted', 'timed_out'] },
      $or: [
        { score: { $gt: attempt.score } },
        { score: attempt.score, durationSeconds: { $lt: attempt.durationSeconds } },
        {
          score: attempt.score,
          durationSeconds: attempt.durationSeconds,
          submittedAt: { $lt: attempt.submittedAt },
        },
      ],
    });

    const rank = higherRankCount + 1;
    const totalParticipants = await Attempt.countDocuments({
      quizId: attempt.quizId,
      status: { $in: ['submitted', 'timed_out'] },
    });

    return res.json({
      attempt,
      rank,
      totalParticipants,
      quizDetails: quiz
        ? {
            title: quiz.title,
            category: quiz.category,
            difficulty: quiz.difficulty,
            passingScore: quiz.passingScore,
            marksPerCorrect: quiz.marksPerCorrect,
            negativeMarks: quiz.negativeMarks,
          }
        : null,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'FETCH_RESULT_FAILED', message: err.message });
  }
});

// Student's historical attempts and progress summary
router.get('/my-history', ensureDbConnected, requireAuth, async (req: Request, res: Response) => {
  try {
    const attempts = await Attempt.find({
      studentId: req.session.userId,
      status: { $in: ['submitted', 'timed_out'] },
    })
      .sort({ submittedAt: -1 })
      .select('-questionResults');

    const totalQuizzes = attempts.length;
    const totalScore = attempts.reduce((acc, a) => acc + (a.score || 0), 0);
    const avgAccuracy =
      totalQuizzes > 0
        ? Math.round(attempts.reduce((acc, a) => acc + (a.accuracyPercent || 0), 0) / totalQuizzes)
        : 0;
    const passedCount = attempts.filter((a) => a.isPassed).length;

    return res.json({
      history: attempts,
      stats: {
        totalQuizzes,
        totalScore,
        avgAccuracy,
        passedCount,
        passRate: totalQuizzes > 0 ? Math.round((passedCount / totalQuizzes) * 100) : 0,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'FETCH_HISTORY_FAILED', message: err.message });
  }
});

// DETERMINISTIC LEADERBOARD
// Rules:
// 1. Higher score ranks first (score: -1)
// 2. Shorter duration ranks next (durationSeconds: 1)
// 3. Earlier submission timestamp is the tie-breaker (submittedAt: 1)
router.get('/leaderboard', ensureDbConnected, async (req: Request, res: Response) => {
  try {
    const { quizId, category, limit = '50' } = req.query;

    const matchQuery: any = { status: { $in: ['submitted', 'timed_out'] } };

    if (quizId && quizId !== 'all') {
      if (mongoose.Types.ObjectId.isValid(String(quizId))) {
        matchQuery.quizId = new mongoose.Types.ObjectId(String(quizId));
      }
    }

    if (category && category !== 'all') {
      matchQuery.quizCategory = category;
    }

    // Best attempt per student query or overall rankings
    const rankings = await Attempt.find(matchQuery)
      .sort({ score: -1, durationSeconds: 1, submittedAt: 1 })
      .limit(Number(limit))
      .select('studentName studentEmail studentDepartment studentYear quizTitle quizCategory score totalPossibleMarks accuracyPercent durationSeconds submittedAt isPassed');

    // Deterministically assign rank 1, 2, 3...
    const leaderboard = rankings.map((entry, index) => ({
      rank: index + 1,
      id: entry._id,
      studentName: entry.studentName,
      studentDepartment: entry.studentDepartment,
      studentYear: entry.studentYear,
      quizTitle: entry.quizTitle,
      quizCategory: entry.quizCategory,
      score: entry.score,
      totalPossibleMarks: entry.totalPossibleMarks,
      accuracyPercent: entry.accuracyPercent,
      durationSeconds: entry.durationSeconds,
      submittedAt: entry.submittedAt,
      isPassed: entry.isPassed,
    }));

    return res.json({ leaderboard });
  } catch (err: any) {
    console.error('Leaderboard error:', err);
    return res.status(500).json({ error: 'LEADERBOARD_FAILED', message: err.message });
  }
});

// Admin: View all submissions with student details and filters
router.get('/admin/all-submissions', ensureDbConnected, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { quizId, search, status } = req.query;

    const query: any = {};
    if (quizId && quizId !== 'all') {
      query.quizId = quizId;
    }
    if (status && status !== 'all') {
      query.status = status;
    }
    if (search) {
      const searchRegex = new RegExp(String(search).trim(), 'i');
      query.$or = [{ studentName: searchRegex }, { studentEmail: searchRegex }, { quizTitle: searchRegex }];
    }

    const submissions = await Attempt.find(query)
      .sort({ submittedAt: -1, createdAt: -1 })
      .limit(100)
      .select('studentName studentEmail studentDepartment studentYear quizTitle score totalPossibleMarks accuracyPercent durationSeconds status isPassed submittedAt createdAt');

    return res.json({ submissions });
  } catch (err: any) {
    return res.status(500).json({ error: 'FETCH_SUBMISSIONS_FAILED', message: err.message });
  }
});

export default router;
