import { Router } from 'express';
import {
  initializePayment,
  verifyPayment,
  paystackWebhook,
  getTransactions,
} from '../controllers/paymentController';
import { protect } from '../middleware/auth';
import { isAdminOrManager } from '../middleware/role';

const router = Router();

// Public webhook (Paystack calls this). Orders are only persisted here,
// after the HMAC signature has been verified.
router.post('/webhook', paystackWebhook);

// Authenticated
router.post('/initialize', protect, initializePayment);
router.get('/verify', protect, verifyPayment);

// Admin / manager
router.get('/admin/all', protect, isAdminOrManager, getTransactions);

export default router;