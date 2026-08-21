import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Review } from '../models/Review';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';

const recalcProductRating = async (productId: Types.ObjectId | string): Promise<void> => {
  const objectId = typeof productId === 'string' ? new Types.ObjectId(productId) : productId;
  const result = await Review.aggregate<{ avg: number; count: number }>([
    { $match: { product: objectId, isApproved: true } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const stats = result[0];
  await Product.findByIdAndUpdate(productId, {
    ratingsAverage: stats ? Math.round(stats.avg * 10) / 10 : 0,
    ratingsCount: stats ? stats.count : 0,
  });
};

// Public: approved reviews for a product
export const getReviewsForProduct = asyncHandler(async (req: Request, res: Response) => {
  const productId = req.params.productId;
  const reviews = await Review.find({ product: productId, isApproved: true })
    .populate('user', 'firstName lastName avatar')
    .sort({ createdAt: -1 });
  sendSuccess(res, 200, 'Reviews fetched.', { reviews });
});

// Authenticated: the user's own reviews (used to mark order items as reviewed)
export const getMyReviews = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Not authorized.');
  const reviews = await Review.find({ user: req.user._id })
    .select('product rating title comment isApproved createdAt')
    .sort({ createdAt: -1 });
  sendSuccess(res, 200, 'Your reviews fetched.', { reviews });
});

export const createReview = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) throw new ApiError(401, 'Not authorized.');
  const productId = req.params.productId;
  const { rating, title, comment } = req.body;

  const product = await Product.findById(productId);
  if (!product) return next(new ApiError(404, 'Product not found.'));

  if (!rating || rating < 1 || rating > 5) {
    throw new ApiError(400, 'Rating must be between 1 and 5.');
  }
  if (!comment || !comment.trim()) {
    throw new ApiError(400, 'Review comment is required.');
  }

  const hasBought = await Order.exists({
    user: req.user._id,
    orderStatus: 'delivered',
    'items.product': productId,
  });

  if (!hasBought) {
    throw new ApiError(
      403,
      'You can only review an item after your order containing it has been delivered.'
    );
  }

  const existing = await Review.findOne({ product: productId, user: req.user._id });
  if (existing) {
    throw new ApiError(409, 'You have already reviewed this product.');
  }

  const review = await Review.create({
    product: productId,
    user: req.user._id,
    rating,
    title,
    comment,
    isApproved: false,
  });

  sendSuccess(res, 201, 'Review submitted. It will be visible once approved.', { review });
});

export const updateReview = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) throw new ApiError(401, 'Not authorized.');
  if (req.user.role === 'user') {
    throw new ApiError(403, 'Reviews are final once submitted and cannot be edited.');
  }

  const review = await Review.findById(req.params.id);
  if (!review) return next(new ApiError(404, 'Review not found.'));

  if (req.body.rating !== undefined) {
    if (req.body.rating < 1 || req.body.rating > 5) throw new ApiError(400, 'Rating must be between 1 and 5.');
    review.rating = req.body.rating;
  }
  if (req.body.comment !== undefined) review.comment = req.body.comment;
  if (req.body.title !== undefined) review.title = req.body.title;

  review.isApproved = false;
  await review.save();
  await recalcProductRating(review.product.toString());

  sendSuccess(res, 200, 'Review updated and queued for re-approval.', { review });
});

export const deleteReview = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) throw new ApiError(401, 'Not authorized.');
  if (req.user.role === 'user') {
    throw new ApiError(403, 'Reviews are final once submitted and cannot be deleted.');
  }

  const review = await Review.findById(req.params.id);
  if (!review) return next(new ApiError(404, 'Review not found.'));

  await review.deleteOne();
  await recalcProductRating(review.product.toString());
  sendSuccess(res, 200, 'Review deleted.');
});

// -------------------- ADMIN / MANAGER --------------------

export const getAllReviews = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = (() => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    return { page, limit, skip: (page - 1) * limit };
  })();

  const filter: Record<string, unknown> = {};
  if (req.query.approved === 'true') filter.isApproved = true;
  if (req.query.approved === 'false') filter.isApproved = false;

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('user', 'firstName lastName email')
      .populate('product', 'name images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter),
  ]);

  sendSuccess(res, 200, 'Reviews fetched (admin).', {
    reviews,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const approveReview = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const review = await Review.findById(req.params.id);
  if (!review) return next(new ApiError(404, 'Review not found.'));
  review.isApproved = true;
  await review.save();
  await recalcProductRating(review.product.toString());
  sendSuccess(res, 200, 'Review approved.', { review });
});

export const rejectReview = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const review = await Review.findById(req.params.id);
  if (!review) return next(new ApiError(404, 'Review not found.'));
  review.isApproved = false;
  await review.save();
  await recalcProductRating(review.product.toString());
  sendSuccess(res, 200, 'Review rejected.', { review });
});