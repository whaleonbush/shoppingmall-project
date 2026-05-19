import { Router } from 'express';
import {
  getMyCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
} from '../controllers/cartController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', getMyCart);
router.post('/items', addCartItem);
router.patch('/items/:option_id', updateCartItem);
router.delete('/items/:option_id', removeCartItem);
router.delete('/', clearCart);

export default router;
