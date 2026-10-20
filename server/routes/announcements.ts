import { Router, Request, Response } from 'express';
import { Announcement } from '../models/Announcement.ts';
import { AuditLog } from '../models/AuditLog.ts';
import { ensureDbConnected, requireAuth, requireAdmin } from '../middleware/auth.ts';

const router = Router();

// Student / Authenticated: Get announcements
router.get('/', ensureDbConnected, requireAuth, async (req: Request, res: Response) => {
  try {
    const department = req.session.department || '';

    // Filter announcements targeting 'all', 'students', or student's specific department
    const query: any = {
      $or: [
        { targetAudience: 'all' },
        { targetAudience: 'students' },
      ],
    };

    if (department) {
      query.$or.push({ targetAudience: 'department', targetDepartment: department });
    }

    const announcements = await Announcement.find(query).sort({ createdAt: -1 }).limit(20);

    return res.json({ announcements });
  } catch (err: any) {
    return res.status(500).json({ error: 'FETCH_ANNOUNCEMENTS_FAILED', message: err.message });
  }
});

// Admin: Create announcement
router.post('/admin/create', ensureDbConnected, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { title, message, priority, targetAudience, targetDepartment } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'MISSING_FIELDS', message: 'Title and message are required.' });
    }

    const announcement = await Announcement.create({
      title: title.trim(),
      message: message.trim(),
      priority: priority || 'normal',
      targetAudience: targetAudience || 'all',
      targetDepartment: targetDepartment || '',
      authorName: req.session.name || 'Admin',
      createdBy: req.session.userId,
    });

    await AuditLog.create({
      action: 'ANNOUNCEMENT_CREATED',
      performedBy: req.session.userId,
      performedByName: req.session.name,
      details: `Created announcement "${announcement.title}" (${announcement.priority})`,
      ip: req.ip || '',
    });

    return res.status(201).json({ message: 'Announcement published successfully.', announcement });
  } catch (err: any) {
    return res.status(500).json({ error: 'CREATE_ANNOUNCEMENT_FAILED', message: err.message });
  }
});

// Admin: Delete announcement
router.delete('/admin/:id', ensureDbConnected, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await Announcement.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Announcement not found.' });
    }

    await AuditLog.create({
      action: 'ANNOUNCEMENT_DELETED',
      performedBy: req.session.userId,
      performedByName: req.session.name,
      details: `Deleted announcement "${deleted.title}"`,
      ip: req.ip || '',
    });

    return res.json({ message: 'Announcement deleted successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'DELETE_ANNOUNCEMENT_FAILED', message: err.message });
  }
});

export default router;
