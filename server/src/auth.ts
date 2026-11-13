import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { UserProfile, JWTPayload } from './types';

declare global {
  namespace Express {
    interface Request {
      user?: UserProfile;
    }
  }
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is missing');
  }
  return secret;
}

interface UserRow {
  id: number;
  username: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  bio: string;
  deleted_at: string | null;
  created_at: string;
}

export function toUserProfile(row: Omit<UserRow, 'password_hash' | 'created_at'>): UserProfile {
  const isDeleted = row.deleted_at !== null;
  return {
    id: row.id,
    username: row.username,
    first_name: isDeleted ? '' : row.first_name,
    last_name: isDeleted ? '' : row.last_name,
    bio: isDeleted ? '' : row.bio,
    deleted: isDeleted,
  };
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = authHeader.slice(7).trim();
  try {
    const payload = jwt.verify(token, getJwtSecret()) as JWTPayload;
    const userRow = db
      .prepare('SELECT id, username, first_name, last_name, bio, deleted_at FROM users WHERE id = ?')
      .get(payload.id) as Omit<UserRow, 'password_hash' | 'created_at'> | undefined;

    if (!userRow || userRow.deleted_at !== null) {
      res.status(401).json({ error: 'Account not found or deleted' });
      return;
    }

    req.user = toUserProfile(userRow);
    next();
  } catch (_err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export const authRouter = Router();

authRouter.post('/signup', (req: Request, res: Response): void => {
  const { username, password } = req.body ?? {};

  if (typeof username !== 'string' || !USERNAME_REGEX.test(username)) {
    res.status(400).json({
      error: 'Username must be between 3 and 20 characters and contain only letters, numbers, and underscores',
    });
    return;
  }

  if (typeof password !== 'string' || password.length < 6) {
    res.status(400).json({
      error: 'Password must be at least 6 characters long',
    });
    return;
  }

  // Check if username is already taken (SQLite username column has COLLATE NOCASE)
  const existing = db
    .prepare('SELECT id FROM users WHERE username = ?')
    .get(username);

  if (existing) {
    res.status(409).json({ error: 'Username is already taken' });
    return;
  }

  const passwordHash = bcrypt.hashSync(password, 10);

  const result = db
    .prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)')
    .run(username, passwordHash);

  const inserted = db
    .prepare('SELECT id, username, first_name, last_name, bio, deleted_at FROM users WHERE id = ?')
    .get(result.lastInsertRowid) as Omit<UserRow, 'password_hash' | 'created_at'>;

  const user = toUserProfile(inserted);
  const token = signToken({ id: user.id, username: user.username });

  res.status(201).json({ token, user });
});

authRouter.post('/login', (req: Request, res: Response): void => {
  const { username, password } = req.body ?? {};

  if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  const userRow = db
    .prepare('SELECT id, username, password_hash, first_name, last_name, bio, deleted_at FROM users WHERE username = ?')
    .get(username) as UserRow | undefined;

  // Never reveal whether the username exists
  if (!userRow || userRow.deleted_at !== null) {
    res.status(401).json({ error: 'Invalid username or password' });
    return;
  }

  const matches = bcrypt.compareSync(password, userRow.password_hash);
  if (!matches) {
    res.status(401).json({ error: 'Invalid username or password' });
    return;
  }

  const user = toUserProfile(userRow);
  const token = signToken({ id: user.id, username: user.username });

  res.status(200).json({ token, user });
});
