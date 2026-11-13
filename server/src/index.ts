import http from 'node:http';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { db } from './db';
import { authRouter } from './auth';
import { usersRouter } from './users';
import { conversationsRouter } from './conversations';
import { initSocketServer } from './sockets';

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required.');
  process.exit(1);
}

const app = express();
const port = Number(process.env.PORT) || 4000;
const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

app.use(cors({ origin: clientUrl, credentials: true }));
app.use(express.json());

// Return JSON error on malformed JSON payload per Rule 11
app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SyntaxError && 'status' in err && (err as { status: number }).status === 400) {
    res.status(400).json({ error: 'Invalid JSON payload' });
    return;
  }
  next(err);
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRouter);
app.use('/api', usersRouter);
app.use('/api/conversations', conversationsRouter);

const httpServer = http.createServer(app);
const io = initSocketServer(httpServer, clientUrl);

export const server = httpServer.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

export { app, db, io };
