import { Router } from 'express';
import {
  createProductOption,
  listProductOptions,
  getProductOptionById,
  updateProductOption,
  deleteProductOption,
} from '../controllers/productOptionController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', listProductOptions);
router.get('/:id', getProductOptionById);

router.post('/', requireAuth, requireAdmin, createProductOption);
router.patch('/:id', requireAuth, requireAdmin, updateProductOption);
router.delete('/:id', requireAuth, requireAdmin, deleteProductOption);

export default router;
