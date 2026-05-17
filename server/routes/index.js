import { Router } from 'express';
import usersRouter from './users.js';
import authRouter from './auth.js';
import productOptionsRouter from './productOptions.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json({ message: 'Shopping mall API' });
});

router.use('/auth', authRouter);
router.use('/product-options', productOptionsRouter);
router.use('/users', usersRouter);

export default router;
