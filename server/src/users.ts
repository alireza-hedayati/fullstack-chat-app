import { Router, Request, Response } from 'express';
import { requireAuth } from './auth';

export const usersRouter = Router();

usersRouter.get('/me', requireAuth, (req: Request, res: Response): void => {
  // req.user is guaranteed to be present and active by requireAuth
  res.status(200).json(req.user);
});
