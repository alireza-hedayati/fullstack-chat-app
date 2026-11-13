import express from 'express';
import cors from 'cors';
import { db } from './db';

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required.');
  process.exit(1);
}

const app = express();
const port = Number(process.env.PORT) || 4000;
const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

app.use(cors({ origin: clientUrl, credentials: true }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

export const server = app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

export { app, db };
