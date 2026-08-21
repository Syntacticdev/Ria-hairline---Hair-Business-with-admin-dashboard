import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Address } from '../models/Address';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { Review } from '../models/Review';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { isMongoId } from '../utils/validators';
import { deleteCloudinaryAsset } from '../utils/cloudinaryUpload';
import { uploadBufferIfAvatar } from '../utils/avatarUpload';

// -------------------- PROFILE (self) --------------------

export const updateProfile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) throw new ApiError(401, 'Not authorized.');

  const { firstName, lastName, phone } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) return next(new ApiError(404, 'User not found.'));

  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (phone !== undefined) user.phone = phone;

  const file = req.file as Express.Multer.File | undefined;
  if (file) {
    if (user.avatar) await deleteCloudinaryAsset(user.avatar);
    user.avatar = await uploadBufferIfAvatar(file);
  }

  await user.save();
  sendSuccess(res, 200, 'Profile updated.', { user });
});

export const setPasswordForGoogleUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) throw new ApiError(401, 'Not authorized.');
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters long.');
  }
  const user = await User.findById(req.user._id).select('+password');
  if (!user) return next(new ApiError(404, 'User not found.'));
  user.password = newPassword;
  await user.save();
  sendSuccess(res, 200, 'Password set. You can now also log in with your email and password.');
});

// -------------------- ADDRESS BOOK --------------------

export const getMyAddresses = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Not authorized.');
  const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
  sendSuccess(res, 200, 'Addresses fetched.', { addresses });
});

export const addAddress = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Not authorized.');
  const body = req.body;

  const count = await Address.countDocuments({ user: req.user._id });
  const isFirst = count === 0;
  const makeDefault = body.isDefault === true || isFirst;

  const address = await Address.create({ ...body, user: req.user._id, isDefault: makeDefault });

  if (makeDefault) {
    await Address.updateMany({ user: req.user._id, _id: { $ne: address._id } }, { $set: { isDefault: false } });
  }
  await User.findByIdAndUpdate(req.user._id, { $push: { addresses: address._id } });

  sendSuccess(res, 201, 'Address added.', { address });
});

export const updateAddress = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) throw new ApiError(401, 'Not authorized.');
  const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
  if (!address) return next(new ApiError(404, 'Address not found.'));

  if (req.body.isDefault === true) {
    await Address.updateMany({ user: req.user._id, _id: { $ne: address._id } }, { $set: { isDefault: false } });
  }

  Object.assign(address, req.body);
  if (address.isDefault !== true && !(await Address.findOne({ user: req.user._id, isDefault: true }))) {
    address.isDefault = true;
  }
  await address.save();
  sendSuccess(res, 200, 'Address updated.', { address });
});

export const setDefaultAddress = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) throw new ApiError(401, 'Not authorized.');
  const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
  if (!address) return next(new ApiError(404, 'Address not found.'));

  await Address.updateMany({ user: req.user._id }, { $set: { isDefault: false } });
  address.isDefault = true;
  await address.save();
  sendSuccess(res, 200, 'Default address set.', { address });
});

export const deleteAddress = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) throw new ApiError(401, 'Not authorized.');
  const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
  if (!address) return next(new ApiError(404, 'Address not found.'));

  await address.deleteOne();
  await User.findByIdAndUpdate(req.user._id, { $pull: { addresses: address._id } });

  const remaining = await Address.findOne({ user: req.user._id });
  if (address.isDefault && remaining) {
    remaining.isDefault = true;
    await remaining.save();
  }

  sendSuccess(res, 200, 'Address deleted.');
});

// -------------------- ADMIN --------------------

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (typeof req.query.role === 'string' && req.query.role) filter.role = req.query.role;
  if (typeof req.query.search === 'string' && req.query.search) {
    filter.$or = [
      { firstName: { $regex: req.query.search, $options: 'i' } },
      { lastName: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  sendSuccess(res, 200, 'Users fetched (admin).', {
    users,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const updateUserRole = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) throw new ApiError(401, 'Not authorized.');
  const id = req.params.id;
  const role = req.body?.role;
  const isActive = req.body?.isActive;

  if (!['user', 'manager', 'admin'].includes(role) && role !== undefined) {
    throw new ApiError(400, 'Invalid role.');
  }

  const target = await User.findById(id);
  if (!target) return next(new ApiError(404, 'User not found.'));

  if (target._id.toString() === req.user._id.toString()) {
    throw new ApiError(400, 'You cannot change your own role or status.');
  }

  if (role !== undefined) target.role = role;
  if (typeof isActive === 'boolean') target.isActive = isActive;
  await target.save();

  sendSuccess(res, 200, 'User updated.', { user: target });
});

// -------------------- DASHBOARD STATS (admin) --------------------

export const getDashboardStats = asyncHandler(async (_req: Request, res: Response) => {
  const [totalUsers, totalProducts, totalOrders, totalRevenueRaw, lowStock, pendingReviews] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments({ isActive: true }),
    Order.countDocuments({ paymentStatus: 'paid' }),
    Order.aggregate<{ total: number }>([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    Product.countDocuments({ stock: { $lte: 10 } }),
    Review.countDocuments({ isApproved: false }),
  ]);

  const recentOrders = await Order.find({ paymentStatus: 'paid' })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('orderNumber totalAmount orderStatus createdAt');

  sendSuccess(res, 200, 'Dashboard stats fetched.', {
    stats: {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue: totalRevenueRaw[0]?.total ?? 0,
      lowStock,
      pendingReviews,
    },
    recentOrders,
  });
});