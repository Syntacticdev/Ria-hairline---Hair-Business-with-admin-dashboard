import { Router } from 'express';
import {
  getReviewsForProduct,
  createReview,
  getMyReviews,
  updateReview,
  deleteReview,
  getAllReviews,
  approveReview,
  rejectReview,
} from '../controllers/reviewController';
import { protect } from '../middleware/auth';
import { isAdminOrManager } from '../middleware/role';

const router = Router();

// Public
router.get('/product/:productId', getReviewsForProduct);

// User (authenticated)
router.get('/my', protect, getMyReviews);
router.post('/product/:productId', protect, createReview);

// Admin / Manager only (reviews are final once submitted by a user)
router.put('/:id', protect, isAdminOrManager, updateReview);
router.delete('/:id', protect, isAdminOrManager, deleteReview);

// Admin / Manager
router.get('/admin/all', protect, isAdminOrManager, getAllReviews);
router.patch('/:id/approve', protect, isAdminOrManager, approveReview);
router.patch('/:id/reject', protect, isAdminOrManager, rejectReview);

export default router;