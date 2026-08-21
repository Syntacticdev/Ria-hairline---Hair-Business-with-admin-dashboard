import { Router } from 'express';
import {
  updateProfile,
  setPasswordForGoogleUser,
  getMyAddresses,
  addAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
  getAllUsers,
  updateUserRole,
  getDashboardStats,
} from '../controllers/userController';
import { protect } from '../middleware/auth';
import { isAdminOrManager } from '../middleware/role';
import { productUpload } from '../middleware/upload';

const router = Router();

// Auth required
router.use(protect);

// Profile
router.put('/profile', productUpload.single('avatar'), updateProfile);
router.post('/set-password', setPasswordForGoogleUser);

// Address book
router.get('/addresses', getMyAddresses);
router.post('/addresses', addAddress);
router.put('/addresses/:id', updateAddress);
router.patch('/addresses/:id/default', setDefaultAddress);
router.delete('/addresses/:id', deleteAddress);

// Admin / Manager
router.get('/admin/all', isAdminOrManager, getAllUsers);
router.patch('/admin/:id', isAdminOrManager, updateUserRole);
router.get('/admin/stats/dashboard', isAdminOrManager, getDashboardStats);

export default router;