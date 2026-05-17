import { Router } from 'express';
import usersRouter from './users.js';
import authRouter from './auth.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json({ message: 'Shopping mall API' });
});

router.use('/auth', authRouter);
router.use('/users', usersRouter);

export default router;
