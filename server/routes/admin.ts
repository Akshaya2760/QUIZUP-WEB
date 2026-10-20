import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { User, findUserByIdOrCustomId } from '../models/User.ts';
import { Quiz } from '../models/Quiz.ts';
import { Attempt } from '../models/Attempt.ts';
import { AuditLog } from '../models/AuditLog.ts';
import { Announcement } from '../models/Announcement.ts';
import { ensureDbConnected, requireAdmin } from '../middleware/auth.ts';

const router = Router();

// Apply admin guard to all routes
router.use(ensureDbConnected, requireAdmin);

// Dashboard overview statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const [
      totalStudents,
      pendingStudents,
      approvedStudents,
      rejectedStudents,
      suspendedStudents,
      totalQuizzes,
      publishedQuizzes,
      totalAttempts,
      recentAttempts,
      recentAudits,
      pendingRequestsList,
      approvedStudentsList,
    ] = await Promise.all([
      User.countDocuments({ role: { $in: ['student', 'STUDENT'] } }),
      User.countDocuments({ role: { $in: ['student', 'STUDENT'] }, status: { $regex: /^pending$/i } }),
      User.countDocuments({ role: { $in: ['student', 'STUDENT'] }, status: { $regex: /^approved$/i } }),
      User.countDocuments({ role: { $in: ['student', 'STUDENT'] }, status: { $regex: /^rejected$/i } }),
      User.countDocuments({ role: { $in: ['student', 'STUDENT'] }, status: { $regex: /^suspended$/i } }),
      Quiz.countDocuments(),
      Quiz.countDocuments({ isPublished: true }),
      Attempt.countDocuments({ status: { $in: ['submitted', 'timed_out'] } }),
      Attempt.find({ status: { $in: ['submitted', 'timed_out'] } })
        .sort({ submittedAt: -1 })
        .limit(6)
        .select('studentName quizTitle score totalPossibleMarks accuracyPercent submittedAt durationSeconds isPassed'),
      AuditLog.find()
        .sort({ createdAt: -1 })
        .limit(10),
      User.find({ role: { $in: ['student', 'STUDENT'] }, status: { $regex: /^pending$/i } })
        .sort({ createdAt: -1 })
        .limit(25)
        .select('-passwordHash'),
      User.find({ role: { $in: ['student', 'STUDENT'] }, status: { $regex: /^approved$/i } })
        .sort({ approvedAt: -1, updatedAt: -1, createdAt: -1 })
        .limit(25)
        .select('-passwordHash'),
    ]);

    // Calculate overall average score
    const scoreAgg = await Attempt.aggregate([
      { $match: { status: { $in: ['submitted', 'timed_out'] } } },
      {
        $group: {
          _id: null,
          avgScore: { $avg: '$score' },
          avgAccuracy: { $avg: '$accuracyPercent' },
          passCount: { $sum: { $cond: ['$isPassed', 1, 0] } },
        },
      },
    ]);

    const performance = scoreAgg[0] || { avgScore: 0, avgAccuracy: 0, passCount: 0 };

    return res.json({
      students: {
        total: totalStudents,
        pending: pendingStudents,
        approved: approvedStudents,
        rejected: rejectedStudents,
        suspended: suspendedStudents,
      },
      quizzes: {
        total: totalQuizzes,
        published: publishedQuizzes,
        drafts: totalQuizzes - publishedQuizzes,
      },
      submissions: {
        total: totalAttempts,
        averageScore: Math.round((performance.avgScore || 0) * 10) / 10,
        averageAccuracy: Math.round((performance.avgAccuracy || 0) * 10) / 10,
        passRate: totalAttempts > 0 ? Math.round((performance.passCount / totalAttempts) * 100) : 0,
      },
      recentActivity: recentAudits,
      recentSubmissions: recentAttempts,
      pendingRequests: pendingRequestsList,
      approvedStudents: approvedStudentsList,
    });
  } catch (err: any) {
    console.error('Admin stats error:', err);
    return res.status(500).json({ error: 'FAILED_FETCH_STATS', message: err.message });
  }
});

// List students with search, status filter, and pagination
router.get('/students', async (req: Request, res: Response) => {
  try {
    const { search, status, department, limit = '50', skip = '0' } = req.query;

    const query: any = { role: { $in: ['student', 'STUDENT'] } };

    if (status && status !== 'all') {
      query.status = { $regex: new RegExp(`^${String(status).trim()}$`, 'i') };
    }

    if (department && department !== 'all') {
      query.department = department;
    }

    if (search) {
      const searchRegex = new RegExp(String(search).trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { studentId: searchRegex },
      ];
    }

    const students = await User.find(query)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit));

    const total = await User.countDocuments(query);

    return res.json({
      students,
      total,
      limit: Number(limit),
      skip: Number(skip),
    });
  } catch (err: any) {
    console.error('List students error:', err);
    return res.status(500).json({ error: 'FAILED_FETCH_STUDENTS', message: err.message });
  }
});

// Approve a student
router.post('/students/:id/approve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const student = await findUserByIdOrCustomId(id);

    if (!student || student.role !== 'student') {
      return res.status(404).json({ error: 'STUDENT_NOT_FOUND', message: 'Student not found.' });
    }

    const adminObjectId = (req.session.userId && mongoose.Types.ObjectId.isValid(req.session.userId))
      ? new mongoose.Types.ObjectId(req.session.userId)
      : undefined;

    student.status = 'approved';
    student.approvedAt = new Date();
    student.approvedBy = adminObjectId;
    student.statusReason = '';
    if (!student.badges.includes('Verified Scholar')) {
      student.badges.push('Verified Scholar');
    }
    await student.save();

    await AuditLog.create({
      action: 'STUDENT_APPROVED',
      performedBy: adminObjectId,
      performedByName: req.session.name || 'Administrator',
      targetUser: student._id,
      targetUserName: student.name,
      details: `Student account approved: ${student.name} (${student.email})`,
      ip: req.ip || '',
    });

    return res.json({
      message: `Student ${student.name} has been approved.`,
      student,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'APPROVE_FAILED', message: err.message });
  }
});

// Reject a student
router.post('/students/:id/reject', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const student = await findUserByIdOrCustomId(id);

    if (!student || student.role !== 'student') {
      return res.status(404).json({ error: 'STUDENT_NOT_FOUND', message: 'Student not found.' });
    }

    const adminObjectId = (req.session.userId && mongoose.Types.ObjectId.isValid(req.session.userId))
      ? new mongoose.Types.ObjectId(req.session.userId)
      : undefined;

    student.status = 'rejected';
    student.rejectedAt = new Date();
    student.statusReason = reason?.trim() || 'Registration credentials could not be verified.';
    await student.save();

    await AuditLog.create({
      action: 'STUDENT_REJECTED',
      performedBy: adminObjectId,
      performedByName: req.session.name || 'Administrator',
      targetUser: student._id,
      targetUserName: student.name,
      details: `Student account rejected: ${student.name} (${student.email}). Reason: ${student.statusReason}`,
      ip: req.ip || '',
    });

    return res.json({
      message: `Student registration rejected.`,
      student,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'REJECT_FAILED', message: err.message });
  }
});

// Suspend a student
router.post('/students/:id/suspend', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const student = await findUserByIdOrCustomId(id);

    if (!student || student.role !== 'student') {
      return res.status(404).json({ error: 'STUDENT_NOT_FOUND' });
    }

    const adminObjectId = (req.session.userId && mongoose.Types.ObjectId.isValid(req.session.userId))
      ? new mongoose.Types.ObjectId(req.session.userId)
      : undefined;

    student.status = 'suspended';
    student.suspendedAt = new Date();
    student.statusReason = reason?.trim() || 'Account suspended for policy violation.';
    await student.save();

    await AuditLog.create({
      action: 'STUDENT_SUSPENDED',
      performedBy: adminObjectId,
      performedByName: req.session.name || 'Administrator',
      targetUser: student._id,
      targetUserName: student.name,
      details: `Student suspended: ${student.name}. Reason: ${student.statusReason}`,
      ip: req.ip || '',
    });

    return res.json({
      message: `Student account suspended.`,
      student,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'SUSPEND_FAILED', message: err.message });
  }
});

// Reactivate a student
router.post('/students/:id/reactivate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const student = await findUserByIdOrCustomId(id);

    if (!student || student.role !== 'student') {
      return res.status(404).json({ error: 'STUDENT_NOT_FOUND' });
    }

    const adminObjectId = (req.session.userId && mongoose.Types.ObjectId.isValid(req.session.userId))
      ? new mongoose.Types.ObjectId(req.session.userId)
      : undefined;

    student.status = 'approved';
    student.statusReason = '';
    await student.save();

    await AuditLog.create({
      action: 'STUDENT_REACTIVATED',
      performedBy: adminObjectId,
      performedByName: req.session.name || 'Administrator',
      targetUser: student._id,
      targetUserName: student.name,
      details: `Student reactivated: ${student.name}`,
      ip: req.ip || '',
    });

    return res.json({
      message: `Student account reactivated and approved.`,
      student,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'REACTIVATE_FAILED', message: err.message });
  }
});

// View Audit Logs
router.get('/audit-logs', async (req: Request, res: Response) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
    return res.json({ logs });
  } catch (err: any) {
    return res.status(500).json({ error: 'FAILED_FETCH_LOGS', message: err.message });
  }
});

export default router;
