import { Router, Request, Response } from 'express';
import { requireAuth, toUserProfile } from './auth';
import { db } from './db';
import { ConversationSummary, Message, UserProfile } from './types';

interface UserRow {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  bio: string;
  deleted_at: string | null;
}

interface ConversationRow {
  id: number;
  conv_created_at: string;
  peer_id: number;
  peer_username: string;
  peer_first_name: string;
  peer_last_name: string;
  peer_bio: string;
  peer_deleted_at: string | null;
  last_msg_id: number | null;
  last_msg_sender_id: number | null;
  last_msg_content: string | null;
  last_msg_created_at: string | null;
}

export const conversationsRouter = Router();

conversationsRouter.post('/', requireAuth, (req: Request, res: Response): void => {
  const { username } = req.body ?? {};

  if (!username || typeof username !== 'string' || !username.trim()) {
    res.status(400).json({ error: 'Username is required' });
    return;
  }

  const targetUsername = username.trim();

  // Cannot create conversation with yourself
  if (targetUsername.toLowerCase() === req.user!.username.toLowerCase()) {
    res.status(400).json({ error: 'Cannot create conversation with yourself' });
    return;
  }

  // Look up target peer
  const peer = db
    .prepare('SELECT id, username, first_name, last_name, bio, deleted_at FROM users WHERE username = ?')
    .get(targetUsername) as UserRow | undefined;

  if (!peer) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  if (peer.deleted_at !== null) {
    res.status(409).json({ error: 'Cannot start a conversation with a deleted user' });
    return;
  }

  // Enforce canonical order: user_a < user_b per architecture schema
  const userA = Math.min(req.user!.id, peer.id);
  const userB = Math.max(req.user!.id, peer.id);

  const existing = db
    .prepare('SELECT id FROM conversations WHERE user_a = ? AND user_b = ?')
    .get(userA, userB) as { id: number } | undefined;

  const peerProfile: UserProfile = toUserProfile(peer);

  if (existing) {
    const lastMsg = db
      .prepare(`
        SELECT id, conversation_id, sender_id, content, created_at
        FROM messages
        WHERE conversation_id = ?
        ORDER BY id DESC
        LIMIT 1
      `)
      .get(existing.id) as Message | undefined;

    const summary: ConversationSummary = {
      id: existing.id,
      peer: peerProfile,
      last_message: lastMsg || null,
    };
    res.status(200).json(summary);
    return;
  }

  const insertResult = db
    .prepare('INSERT INTO conversations (user_a, user_b) VALUES (?, ?)')
    .run(userA, userB);

  const summary: ConversationSummary = {
    id: Number(insertResult.lastInsertRowid),
    peer: peerProfile,
    last_message: null,
  };

  res.status(201).json(summary);
});

conversationsRouter.get('/', requireAuth, (req: Request, res: Response): void => {
  const currentUserId = req.user!.id;

  const rows = db
    .prepare(`
      SELECT 
        c.id,
        c.created_at AS conv_created_at,
        CASE WHEN c.user_a = ? THEN c.user_b ELSE c.user_a END AS peer_id,
        u.username AS peer_username,
        u.first_name AS peer_first_name,
        u.last_name AS peer_last_name,
        u.bio AS peer_bio,
        u.deleted_at AS peer_deleted_at,
        m.id AS last_msg_id,
        m.sender_id AS last_msg_sender_id,
        m.content AS last_msg_content,
        m.created_at AS last_msg_created_at
      FROM conversations c
      JOIN users u ON u.id = CASE WHEN c.user_a = ? THEN c.user_b ELSE c.user_a END
      LEFT JOIN messages m ON m.id = (
        SELECT id FROM messages 
        WHERE conversation_id = c.id 
        ORDER BY id DESC LIMIT 1
      )
      WHERE c.user_a = ? OR c.user_b = ?
      ORDER BY COALESCE(m.created_at, c.created_at) DESC, c.id DESC
    `)
    .all(currentUserId, currentUserId, currentUserId, currentUserId) as ConversationRow[];

  const summaries: ConversationSummary[] = rows.map((row) => ({
    id: row.id,
    peer: toUserProfile({
      id: row.peer_id,
      username: row.peer_username,
      first_name: row.peer_first_name,
      last_name: row.peer_last_name,
      bio: row.peer_bio,
      deleted_at: row.peer_deleted_at,
    }),
    last_message: row.last_msg_id
      ? {
          id: row.last_msg_id,
          conversation_id: row.id,
          sender_id: row.last_msg_sender_id!,
          content: row.last_msg_content!,
          created_at: row.last_msg_created_at!,
        }
      : null,
  }));

  res.status(200).json(summaries);
});

// GET /api/conversations/:id/messages (last 50, oldest first, participants only)
conversationsRouter.get('/:id/messages', requireAuth, (req: Request, res: Response): void => {
  const conversationId = Number(req.params.id);
  if (isNaN(conversationId)) {
    res.status(400).json({ error: 'Invalid conversation ID' });
    return;
  }

  const conv = db
    .prepare('SELECT id, user_a, user_b FROM conversations WHERE id = ?')
    .get(conversationId) as { id: number; user_a: number; user_b: number } | undefined;

  if (!conv) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }

  // Caller must be a participant
  if (conv.user_a !== req.user!.id && conv.user_b !== req.user!.id) {
    res.status(403).json({ error: 'Not a participant in this conversation' });
    return;
  }

  // Fetch last 50 messages, ordered oldest first
  const messages = db
    .prepare(`
      SELECT id, conversation_id, sender_id, content, created_at
      FROM (
        SELECT id, conversation_id, sender_id, content, created_at
        FROM messages
        WHERE conversation_id = ?
        ORDER BY id DESC
        LIMIT 50
      )
      ORDER BY id ASC
    `)
    .all(conversationId) as Message[];

  res.status(200).json(messages);
});
