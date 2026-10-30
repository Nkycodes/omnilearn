import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { UserStore } from '../db.js';
import { generateToken, authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Zod schemas for request validation
const RegisterSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  name: z.string().min(1, 'Name is required').optional(),
});

const LoginSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

// POST /register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = RegisterSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: parseResult.error.issues?.[0]?.message || 'Invalid input data',
      });
      return;
    }

    const { email, password, name } = parseResult.data;

    // Check if user already exists
    const existingUser = await UserStore.findByEmail(email);
    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'An account with this email already exists. Please log in instead.',
      });
      return;
    }

    // Hash password with bcrypt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const newUser = await UserStore.create({
      email,
      passwordHash,
      name: name || email.split('@')[0],
    });

    // Generate JWT token
    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
    });
  } catch (err: any) {
    console.error('[Auth] Registration error:', err);
    res.status(500).json({
      success: false,
      error: 'Registration failed due to an internal server error',
    });
  }
});

// POST /login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = LoginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: parseResult.error.issues?.[0]?.message || 'Invalid login credentials',
      });
      return;
    }

    const { email, password } = parseResult.data;

    const user = await UserStore.findByEmail(email);
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
      return;
    }

    // Verify password hash
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
      return;
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (err: any) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({
      success: false,
      error: 'Login failed due to an internal server error',
    });
  }
});

// GET /me (verify current token)
router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await UserStore.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve profile' });
  }
});

// POST /firebase-sync (sync Firebase authenticated user with local store and generate JWT)
router.post('/firebase-sync', async (req: Request, res: Response): Promise<void> => {
  try {
    const { uid, email, displayName, photoURL } = req.body;
    if (!uid || !email) {
      res.status(400).json({ success: false, error: 'Firebase uid and email are required' });
      return;
    }

    let user = await UserStore.findByEmail(email);
    if (!user) {
      user = await UserStore.create({
        email,
        passwordHash: 'FIREBASE_AUTH_' + uid,
        name: displayName || email.split('@')[0],
      });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        photoURL: photoURL || '',
      },
    });
  } catch (err: any) {
    console.error('[Auth] Firebase sync error:', err);
    res.status(500).json({ success: false, error: 'Failed to sync Firebase user session' });
  }
});

export default router;
