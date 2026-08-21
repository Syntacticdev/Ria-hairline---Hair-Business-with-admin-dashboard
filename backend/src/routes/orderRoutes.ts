import { Router } from 'express';
import {
  getMyOrders,
  getMyOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  getOrderAdminById,
} from '../controllers/orderController';
import { protect } from '../middleware/auth';
import { isAdminOrManager } from '../middleware/role';

const router = Router();

// User
router.use(protect);
router.get('/my', getMyOrders);
router.get('/my/:id', getMyOrderById);
router.patch('/my/:id/cancel', cancelOrder);

// Admin / Manager
router.get('/admin/all', isAdminOrManager, getAllOrders);
router.get('/admin/:id', isAdminOrManager, getOrderAdminById);
router.patch('/admin/:id/status', isAdminOrManager, updateOrderStatus);

export default router;