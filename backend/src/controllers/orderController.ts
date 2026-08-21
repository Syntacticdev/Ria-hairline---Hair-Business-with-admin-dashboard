import { Request, Response, NextFunction } from 'express';
import { Order, OrderStatus } from '../models/Order';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';

// -------------------- USER --------------------

export const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Not authorized.');
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find({ user: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments({ user: req.user._id }),
  ]);

  sendSuccess(res, 200, 'Orders fetched.', {
    orders,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const getMyOrderById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) throw new ApiError(401, 'Not authorized.');
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) return next(new ApiError(404, 'Order not found.'));
  sendSuccess(res, 200, 'Order fetched.', { order });
});

export const cancelOrder = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) throw new ApiError(401, 'Not authorized.');
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) return next(new ApiError(404, 'Order not found.'));
  if (!['pending', 'processing'].includes(order.orderStatus)) {
    throw new ApiError(400, `Order cannot be cancelled while status is "${order.orderStatus}".`);
  }
  if (order.paymentStatus === 'paid') {
    throw new ApiError(400, 'Paid orders cannot be cancelled here. Contact support for a refund.');
  }

  order.orderStatus = 'cancelled';
  order.paymentStatus = 'failed';
  await order.save();
  sendSuccess(res, 200, 'Order cancelled.', { order });
});

// -------------------- ADMIN / MANAGER --------------------

export const getAllOrders = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (typeof req.query.status === 'string' && req.query.status) filter.orderStatus = req.query.status;
  if (typeof req.query.paymentStatus === 'string' && req.query.paymentStatus) {
    filter.paymentStatus = req.query.paymentStatus;
  }
  if (typeof req.query.search === 'string' && req.query.search) {
    filter.$or = [
      { orderNumber: { $regex: req.query.search, $options: 'i' } },
      { paymentReference: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  sendSuccess(res, 200, 'Orders fetched (admin).', {
    orders,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

const VALID_STATUSES: OrderStatus[] = [
  'pending',
  'processing',
  'shipped',
  'in_transit',
  'delivered',
  'cancelled',
  'refunded',
];

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const status = req.body?.orderStatus as OrderStatus;
  if (!VALID_STATUSES.includes(status)) {
    throw new ApiError(400, `Invalid order status. Allowed: ${VALID_STATUSES.join(', ')}.`);
  }

  const order = await Order.findById(req.params.id);
  if (!order) return next(new ApiError(404, 'Order not found.'));

  if (status === 'cancelled' && order.paymentStatus === 'paid') {
    order.paymentStatus = 'failed';
  }

  order.orderStatus = status;
  await order.save();
  sendSuccess(res, 200, 'Order status updated.', { order });
});

export const getOrderAdminById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const order = await Order.findById(req.params.id).populate('user', 'firstName lastName email phone');
  if (!order) return next(new ApiError(404, 'Order not found.'));
  sendSuccess(res, 200, 'Order fetched.', { order });
});