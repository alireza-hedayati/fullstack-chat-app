import http from 'node:http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from './auth';
import { db } from './db';
import { JWTPayload, Message } from './types';

interface SocketUser {
  id: number;
  username: string;
}

interface SocketData {
  user: SocketUser;
}

export function initSocketServer(httpServer: http.Server, clientUrl: string): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: clientUrl,
      credentials: true,
    },
  });

  // JWT Handshake Authentication Middleware
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token || typeof token !== 'string') {
      return next(new Error('Not authenticated'));
    }

    try {
      const payload = jwt.verify(token, getJwtSecret()) as JWTPayload;
      const user = db
        .prepare('SELECT id, username, deleted_at FROM users WHERE id = ?')
        .get(payload.id) as { id: number; username: string; deleted_at: string | null } | undefined;

      if (!user || user.deleted_at !== null) {
        return next(new Error('Not authenticated'));
      }

      socket.data.user = { id: user.id, username: user.username };
      next();
    } catch {
      return next(new Error('Not authenticated'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as SocketUser;

    // Join personal room per architecture spec
    socket.join(`user:${user.id}`);

    // Handle incoming messages
    socket.on(
      'message:send',
      (
        payload: { conversation_id?: unknown; content?: unknown },
        ack?: (res: { ok: true; message: Message } | { ok: false; error: string }) => void
      ) => {
        const sendAck = (response: { ok: true; message: Message } | { ok: false; error: string }) => {
          if (typeof ack === 'function') {
            ack(response);
          }
        };

        const conversationId = Number(payload?.conversation_id);
        const rawContent = payload?.content;

        if (isNaN(conversationId)) {
          sendAck({ ok: false, error: 'Invalid conversation ID' });
          return;
        }

        if (typeof rawContent !== 'string') {
          sendAck({ ok: false, error: 'Message content must be a string' });
          return;
        }

        const trimmedContent = rawContent.trim();
        if (trimmedContent.length === 0 || trimmedContent.length > 2000) {
          sendAck({ ok: false, error: 'Message content must be between 1 and 2000 characters' });
          return;
        }

        // 1. Verify conversation exists and sender is participant
        const conv = db
          .prepare('SELECT id, user_a, user_b FROM conversations WHERE id = ?')
          .get(conversationId) as { id: number; user_a: number; user_b: number } | undefined;

        if (!conv || (conv.user_a !== user.id && conv.user_b !== user.id)) {
          sendAck({ ok: false, error: 'Not a participant in this conversation' });
          return;
        }

        // 2. Verify peer not deleted
        const peerId = conv.user_a === user.id ? conv.user_b : conv.user_a;
        const peer = db
          .prepare('SELECT id, deleted_at FROM users WHERE id = ?')
          .get(peerId) as { id: number; deleted_at: string | null } | undefined;

        if (!peer || peer.deleted_at !== null) {
          sendAck({ ok: false, error: 'Cannot send message to a deleted user' });
          return;
        }

        // 3. INSERT message into database
        const insertResult = db
          .prepare('INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?)')
          .run(conversationId, user.id, trimmedContent);

        const insertedMsg = db
          .prepare('SELECT id, conversation_id, sender_id, content, created_at FROM messages WHERE id = ?')
          .get(insertResult.lastInsertRowid) as Message;

        // 4. Ack success to sender
        sendAck({ ok: true, message: insertedMsg });

        // 5. Emit message:new to both participants' personal rooms
        io.to(`user:${user.id}`).to(`user:${peerId}`).emit('message:new', insertedMsg);
      }
    );
  });

  return io;
}
