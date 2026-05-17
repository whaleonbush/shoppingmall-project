import { Router } from 'express';
import {
  createUser,
  listUsers,
  getUserById,
  updateUser,
  deleteUser,
} from '../controllers/userController.js';

const router = Router();

router.post('/', createUser);
router.get('/', listUsers);
router.get('/:id', getUserById);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
