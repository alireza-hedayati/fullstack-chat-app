import { Router, Request, Response } from 'express';
import { requireAuth, toUserProfile } from './auth';
import { db } from './db';
import { UserProfile } from './types';

interface UserRow {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  bio: string;
  deleted_at: string | null;
}

export const usersRouter = Router();

usersRouter.get('/me', requireAuth, (req: Request, res: Response): void => {
  res.status(200).json(req.user);
});

usersRouter.patch('/me', requireAuth, (req: Request, res: Response): void => {
  const { first_name, last_name, bio } = req.body ?? {};

  if (first_name !== undefined && typeof first_name !== 'string') {
    res.status(400).json({ error: 'First name must be a string' });
    return;
  }
  if (last_name !== undefined && typeof last_name !== 'string') {
    res.status(400).json({ error: 'Last name must be a string' });
    return;
  }
  if (bio !== undefined && typeof bio !== 'string') {
    res.status(400).json({ error: 'Bio must be a string' });
    return;
  }

  const trimmedFirst = first_name !== undefined ? first_name.trim() : undefined;
  const trimmedLast = last_name !== undefined ? last_name.trim() : undefined;
  const trimmedBio = bio !== undefined ? bio.trim() : undefined;

  if (trimmedFirst !== undefined && trimmedFirst.length > 40) {
    res.status(400).json({ error: 'First name must not exceed 40 characters' });
    return;
  }
  if (trimmedLast !== undefined && trimmedLast.length > 40) {
    res.status(400).json({ error: 'Last name must not exceed 40 characters' });
    return;
  }
  if (trimmedBio !== undefined && trimmedBio.length > 200) {
    res.status(400).json({ error: 'Bio must not exceed 200 characters' });
    return;
  }

  db.prepare(`
    UPDATE users
    SET first_name = COALESCE(?, first_name),
        last_name  = COALESCE(?, last_name),
        bio        = COALESCE(?, bio)
    WHERE id = ?
  `).run(
    trimmedFirst !== undefined ? trimmedFirst : null,
    trimmedLast !== undefined ? trimmedLast : null,
    trimmedBio !== undefined ? trimmedBio : null,
    req.user!.id
  );

  const updated = db
    .prepare('SELECT id, username, first_name, last_name, bio, deleted_at FROM users WHERE id = ?')
    .get(req.user!.id) as UserRow;

  const profile: UserProfile = toUserProfile(updated);
  res.status(200).json(profile);
});

usersRouter.get('/users', requireAuth, (req: Request, res: Response): void => {
  const query = req.query.q;
  if (typeof query !== 'string' || !query.trim()) {
    res.status(400).json({ error: "Search query 'q' is required" });
    return;
  }

  const trimmedQuery = query.trim();
  const rows = db
    .prepare(`
      SELECT id, username, first_name, last_name, bio, deleted_at
      FROM users
      WHERE username LIKE ? || '%'
        AND id != ?
        AND deleted_at IS NULL
      ORDER BY username ASC
      LIMIT 10
    `)
    .all(trimmedQuery, req.user!.id) as UserRow[];

  const profiles: UserProfile[] = rows.map(toUserProfile);
  res.status(200).json(profiles);
});
