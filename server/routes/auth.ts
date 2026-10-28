import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User, generateUserIdentifier, findUserByIdOrCustomId } from '../models/User.ts';
import { AuditLog } from '../models/AuditLog.ts';
import { ensureDbConnected, requireAuth } from '../middleware/auth.ts';
import { createAuthToken } from '../utils/authTokens.ts';

const router = Router();

// Student Registration
router.post('/register', ensureDbConnected, async (req: Request, res: Response) => {
  try {
    const { name, email, studentId, department, yearOfStudy, password } = req.body;

    if (!name || !email || !studentId || !department || !yearOfStudy || !password) {
      console.warn('[Auth/Register] Validation error: Missing required fields');
      return res.status(400).json({
        error: 'MISSING_FIELDS',
        message: 'All fields (name, email, student ID, department, year of study, password) are required.',
      });
    }

    if (typeof password !== 'string' || password.length < 6) {
      console.warn('[Auth/Register] Validation error: Password length too short');
      return res.status(400).json({
        error: 'INVALID_PASSWORD',
        message: 'Password must be at least 6 characters long.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanStudentId = studentId.trim();
    const cleanDept = department.trim();

    console.log(`[Auth/Register] Processing registration for "${name.trim()}" (Email: ${normalizedEmail}, StudentID: ${cleanStudentId}, Dept: ${cleanDept})`);

    // Check duplicate email
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      console.warn(`[Auth/Register] Duplicate rejected: Email "${normalizedEmail}" is already registered (UserID: ${existing.id || existing._id})`);
      return res.status(409).json({
        error: 'EMAIL_ALREADY_EXISTS',
        message: 'An account with this email address is already registered. Please sign in instead.',
      });
    }

    // Check duplicate student ID within department if provided
    const existingId = await User.findOne({ studentId: cleanStudentId, department: cleanDept });
    if (existingId) {
      console.warn(`[Auth/Register] Duplicate rejected: Student ID "${cleanStudentId}" already exists in department "${cleanDept}"`);
      return res.status(409).json({
        error: 'STUDENT_ID_EXISTS',
        message: 'A student with this ID is already registered under this department.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Explicitly generate a guaranteed unique non-null string identifier
    const uniqueUserId = generateUserIdentifier('student');

    const newUser = await User.create({
      id: uniqueUserId,
      name: name.trim(),
      email: normalizedEmail,
      studentId: cleanStudentId,
      department: cleanDept,
      yearOfStudy: Number(yearOfStudy) || 1,
      passwordHash,
      role: 'student',
      status: 'approved', // Open registration: anyone can register and login immediately
      approvedAt: new Date(),
      badges: ['New Cadet', 'Verified Scholar', 'Registration Completed'],
    });

    console.log(`[Auth/Register] Student created successfully in MongoDB: ${newUser.email} (id: ${newUser.id}, _id: ${newUser._id})`);

    await AuditLog.create({
      action: 'STUDENT_REGISTERED',
      performedBy: newUser._id,
      performedByName: newUser.name,
      targetUser: newUser._id,
      targetUserName: newUser.name,
      details: `Student registered: ${newUser.name} (${newUser.email}) - Dept: ${newUser.department}, ID: ${newUser.studentId}`,
      ip: req.ip || '',
    });

    // Establish session
    req.session.userId = newUser._id.toString();
    req.session.email = newUser.email;
    req.session.name = newUser.name;
    req.session.role = newUser.role;
    req.session.status = newUser.status;
    req.session.department = newUser.department;
    req.session.yearOfStudy = newUser.yearOfStudy;
    // Generate auth token for iframe & cookie resilience
    const token = createAuthToken({
      userId: newUser._id.toString(),
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      status: newUser.status,
      department: newUser.department,
      yearOfStudy: newUser.yearOfStudy,
      studentId: newUser.studentId,
    });

    return res.status(201).json({
      message: 'Registration successful! Welcome to QUIZUP. Your account is active and you can start taking quizzes.',
      token,
      user: {
        id: newUser.id,
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        studentId: newUser.studentId,
        department: newUser.department,
        yearOfStudy: newUser.yearOfStudy,
        role: newUser.role,
        status: newUser.status,
        badges: newUser.badges,
      },
    });
  } catch (err: any) {
    // Structured error logging (passwords omitted)
    console.error('[Auth/Register Error]:', {
      message: err.message,
      code: err.code,
      keyPattern: err.keyPattern,
      keyValue: err.keyValue,
    });

    // Handle MongoServerError code 11000 duplicate key gracefully
    if (err.code === 11000) {
      const fieldName = Object.keys(err.keyPattern || {})[0] || 'credential';
      return res.status(409).json({
        error: 'DUPLICATE_KEY_ERROR',
        message: `An account with this ${fieldName} is already registered.`,
        field: fieldName,
      });
    }

    return res.status(500).json({
      error: 'REGISTRATION_FAILED',
      message: err.message || 'An error occurred during registration. Please try again.',
    });
  }
});

// Login (Student or Admin)
router.post('/login', ensureDbConnected, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'MISSING_CREDENTIALS',
        message: 'Please provide both email and password.',
      });
    }

    const normalizedInput = email.trim().toLowerCase();
    const user = await User.findOne({
      $or: [
        { email: normalizedInput },
        { collegeEmail: normalizedInput },
        { username: normalizedInput },
        { email: new RegExp(`^${normalizedInput}$`, 'i') },
      ],
    });

    if (!user) {
      console.warn(`[Auth/Login] Login failed: User "${normalizedInput}" not found.`);
      return res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
        detail: 'user_not_found',
      });
    }

    const hashToCompare = user.passwordHash || (user as any).password;
    if (!hashToCompare) {
      console.warn(`[Auth/Login] User "${normalizedInput}" has no stored password.`);
      return res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
        detail: 'no_hash',
      });
    }

    const isMatch = await bcrypt.compare(password, hashToCompare);
    if (!isMatch) {
      console.warn(`[Auth/Login] Login failed: Incorrect password for "${normalizedInput}".`);
      return res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
        detail: 'password_mismatch',
      });
    }

    // Ensure user has name, email, and id populated
    if (!user.name && (user as any).fullName) {
      user.name = (user as any).fullName;
    }
    if (!user.email && (user as any).collegeEmail) {
      user.email = (user as any).collegeEmail;
    }
    if (!user.id) {
      user.id = generateUserIdentifier(user.role);
    }

    // Direct registration: ensure any student is immediately approved and active
    const nextStatus = user.role === 'student' && user.status === 'pending' ? 'approved' : user.status;
    user.status = nextStatus as any;

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          id: user.id,
          name: user.name || 'User',
          email: user.email || normalizedInput,
          passwordHash: hashToCompare,
          status: nextStatus,
          approvedAt: user.approvedAt || new Date(),
        },
      }
    );

    console.log(`[Auth/Login] Successful login for: ${user.email} (Role: ${user.role}, Status: ${user.status})`);

    // Session regeneration prevents session fixation attacks
    req.session.regenerate((err) => {
      if (err) {
        console.error('Session regeneration error:', err);
      }

      req.session.userId = user._id.toString();
      req.session.email = user.email;
      req.session.name = user.name;
      req.session.role = user.role;
      req.session.status = user.status;
      req.session.department = user.department;
      req.session.yearOfStudy = user.yearOfStudy;
      req.session.studentId = user.studentId;

      const token = createAuthToken({
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        department: user.department,
        yearOfStudy: user.yearOfStudy,
        studentId: user.studentId,
      });

      return res.json({
        message: 'Logged in successfully.',
        token,
        user: {
          id: user.id || user._id.toString(),
          _id: user._id,
          name: user.name,
          email: user.email,
          studentId: user.studentId,
          department: user.department,
          yearOfStudy: user.yearOfStudy,
          role: user.role,
          status: user.status,
          statusReason: user.statusReason,
          badges: user.badges,
        },
      });
    });
  } catch (err: any) {
    console.error('[Auth/Login Error]:', err.message);
    return res.status(500).json({
      error: 'LOGIN_FAILED',
      message: err.message || 'Login failed due to a server error.',
    });
  }
});

// First-time administrator bootstrap using ADMIN_SETUP_SECRET
router.post('/bootstrap-admin', ensureDbConnected, async (req: Request, res: Response) => {
  try {
    const { setupSecret, name, email, password } = req.body;

    const configuredSecret = process.env.ADMIN_SETUP_SECRET || 'admin123';

    if (!setupSecret || setupSecret !== configuredSecret) {
      return res.status(403).json({
        error: 'INVALID_SECRET',
        message: 'Invalid administrator setup secret key.',
      });
    }

    if (!name || !email || !password || password.length < 6) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'Name, valid email, and password of at least 6 characters are required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    let adminUser = await User.findOne({ email: normalizedEmail });

    if (adminUser) {
      // Elevate existing account to admin and approved
      adminUser.role = 'admin';
      adminUser.status = 'approved';
      adminUser.passwordHash = passwordHash;
      adminUser.name = name.trim();
      if (!adminUser.id) {
        adminUser.id = generateUserIdentifier('admin');
      }
      await adminUser.save();
    } else {
      const generatedAdminId = generateUserIdentifier('admin');
      adminUser = await User.create({
        id: generatedAdminId,
        name: name.trim(),
        email: normalizedEmail,
        department: 'Administration',
        yearOfStudy: 4,
        passwordHash,
        role: 'admin',
        status: 'approved',
        badges: ['Platform Administrator', 'Master Architect'],
      });
    }

    console.log(`[Auth/BootstrapAdmin] Administrator account initialized: ${adminUser.email} (id: ${adminUser.id}, _id: ${adminUser._id})`);

    await AuditLog.create({
      action: 'ADMIN_BOOTSTRAP',
      performedBy: adminUser._id,
      performedByName: adminUser.name,
      targetUser: adminUser._id,
      targetUserName: adminUser.name,
      details: `Administrator account configured: ${adminUser.email}`,
      ip: req.ip || '',
    });

    req.session.userId = adminUser._id.toString();
    req.session.email = adminUser.email;
    req.session.name = adminUser.name;
    req.session.role = adminUser.role;
    req.session.status = adminUser.status;

    const token = createAuthToken({
      userId: adminUser._id.toString(),
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
      status: adminUser.status,
    });

    return res.status(200).json({
      message: 'Administrator account configured and logged in successfully!',
      token,
      user: {
        id: adminUser.id || adminUser._id.toString(),
        _id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        status: adminUser.status,
      },
    });
  } catch (err: any) {
    console.error('[Auth/BootstrapAdmin Error]:', err.message);
    return res.status(500).json({
      error: 'BOOTSTRAP_FAILED',
      message: err.message || 'Failed to initialize administrator account.',
    });
  }
});

// Current user profile check (refreshed from DB)
router.get('/me', ensureDbConnected, async (req: Request, res: Response) => {
  if (!req.session || !req.session.userId) {
    return res.json({ user: null });
  }

  try {
    const user = await findUserByIdOrCustomId(req.session.userId);

    if (!user) {
      req.session.destroy(() => {});
      return res.json({ user: null });
    }

    // Synchronize session with database status
    req.session.status = user.status;
    req.session.role = user.role;
    req.session.name = user.name;

    const token = createAuthToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      department: user.department,
      yearOfStudy: user.yearOfStudy,
      studentId: user.studentId,
    });

    return res.json({
      token,
      user: {
        id: user.id || user._id.toString(),
        _id: user._id,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        department: user.department,
        yearOfStudy: user.yearOfStudy,
        role: user.role,
        status: user.status,
        statusReason: user.statusReason,
        badges: user.badges,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    console.error('Fetch me error:', err);
    return res.status(500).json({ error: 'FAILED_FETCH_USER', message: err.message });
  }
});

// Edit Profile
router.put('/profile', ensureDbConnected, requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, department, yearOfStudy } = req.body;
    const user = await findUserByIdOrCustomId(req.session.userId);

    if (!user) {
      return res.status(404).json({ error: 'USER_NOT_FOUND', message: 'User not found.' });
    }

    if (name) user.name = name.trim();
    if (department) user.department = department.trim();
    if (yearOfStudy) user.yearOfStudy = Number(yearOfStudy);

    await user.save();

    req.session.name = user.name;
    req.session.department = user.department;
    req.session.yearOfStudy = user.yearOfStudy;

    return res.json({
      message: 'Profile updated successfully.',
      user: {
        id: user.id || user._id.toString(),
        _id: user._id,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        department: user.department,
        yearOfStudy: user.yearOfStudy,
        role: user.role,
        status: user.status,
        badges: user.badges,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'PROFILE_UPDATE_FAILED', message: err.message });
  }
});

// Change Password
router.post('/change-password', ensureDbConnected, requireAuth, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({
        error: 'INVALID_PASSWORD',
        message: 'Current password and a new password with at least 6 characters are required.',
      });
    }

    const user = await findUserByIdOrCustomId(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: 'USER_NOT_FOUND' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({
        error: 'INCORRECT_PASSWORD',
        message: 'The current password you entered is incorrect.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.json({ message: 'Password changed successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'PASSWORD_CHANGE_FAILED', message: err.message });
  }
});

// Logout
router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'LOGOUT_FAILED', message: 'Could not log out.' });
    }
    res.clearCookie('quizup.sid');
    res.clearCookie('connect.sid');
    return res.json({ message: 'Logged out successfully.' });
  });
});

export default router;
