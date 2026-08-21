import { Router } from 'express';
import {
  getProducts,
  getProductById,
  getFeaturedProducts,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProductsAdmin,
  toggleProductStatus,
} from '../controllers/productController';
import { protect } from '../middleware/auth';
import { isAdminOrManager } from '../middleware/role';
import { productUpload } from '../middleware/upload';

const router = Router();

// Admin / Manager
router.get('/admin/all', protect, isAdminOrManager, getAllProductsAdmin);

// Public
router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/categories', getCategories);
router.get('/:id', getProductById);

router.post('/', protect, isAdminOrManager, productUpload.array('images', 4), createProduct);
router.put(
  '/:id',
  protect,
  isAdminOrManager,
  productUpload.array('images', 4),
  updateProduct
);
router.patch('/:id/status', protect, isAdminOrManager, toggleProductStatus);
router.delete('/:id', protect, isAdminOrManager, deleteProduct);

export default router;