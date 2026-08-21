import { Request, Response, NextFunction } from 'express';
import { Product } from '../models/Product';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { uploadProductImages, deleteCloudinaryAsset } from '../utils/cloudinaryUpload';

const pagination = (req: Request) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 12));
  return { page, limit, skip: (page - 1) * limit };
};

const normalizeProductBody = (raw: Record<string, unknown>): Record<string, unknown> => {
  const body = { ...raw };
  if ('isActive' in body && typeof body.isActive === 'string') body.isActive = body.isActive === 'true';
  if ('isFeatured' in body && typeof body.isFeatured === 'string') body.isFeatured = body.isFeatured === 'true';
  ['price', 'discountPrice', 'stock'].forEach((k) => {
    if (body[k] !== undefined && body[k] !== '') body[k] = Number(body[k]);
  });
  const sizesArray = body['sizes[]'] as string[] | undefined;
  if (Array.isArray(sizesArray)) {
    body.sizes = sizesArray.map((s) => s.trim()).filter(Boolean);
  } else if (typeof body.sizes === 'string') {
    body.sizes = body.sizes.split(',').map((s) => s.trim()).filter(Boolean);
  }
  delete body['sizes[]'];
  return body;
};

const buildPublicFilter = (req: Request) => {
  const filter: Record<string, unknown> = { isActive: true };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.brand) filter.brand = req.query.brand;
  if (req.query.minPrice || req.query.maxPrice) {
    filter.price = {};
    if (req.query.minPrice) (filter.price as Record<string, unknown>).$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) (filter.price as Record<string, unknown>).$lte = Number(req.query.maxPrice);
  }
  return filter;
};

const buildSearch = (req: Request) => {
  const q = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  if (!q) return {};
  return { $text: { $search: q } };
};

// -------------------- PUBLIC --------------------

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = pagination(req);
  const filter = { ...buildPublicFilter(req), ...buildSearch(req) };

  const [items, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);

  sendSuccess(res, 200, 'Products fetched.', {
    products: items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const getProductById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const product = await Product.findById(req.params.id);
  if (!product || !product.isActive) {
    return next(new ApiError(404, 'Product not found.'));
  }
  sendSuccess(res, 200, 'Product fetched.', { product });
});

export const getFeaturedProducts = asyncHandler(async (_req: Request, res: Response) => {
  const products = await Product.find({ isActive: true, isFeatured: true }).sort({ createdAt: -1 }).limit(12);
  sendSuccess(res, 200, 'Featured products fetched.', { products });
});

export const getCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await Product.distinct('category', { isActive: true });
  sendSuccess(res, 200, 'Categories fetched.', { categories });
});

// -------------------- ADMIN / MANAGER --------------------

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Not authorized.');
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];

  if (files.length === 0) {
    throw new ApiError(400, 'At least one product image is required.');
  }

  const images = await uploadProductImages(files);

  const product = await Product.create({
    ...normalizeProductBody(req.body),
    images,
    createdBy: req.user._id,
  });

  sendSuccess(res, 201, 'Product created successfully.', { product });
});

export const updateProduct = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new ApiError(404, 'Product not found.'));

  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  const body = normalizeProductBody(req.body);

  if (files.length > 0) {
    if (typeof body.removeImages === 'string' && body.removeImages) {
      const toRemove = JSON.parse(body.removeImages) as string[];
      await Promise.all(toRemove.map((url) => deleteCloudinaryAsset(url)));
    }
    const keptUrls = Array.isArray(product.images) ? product.images : [];
    const removeList = body.removeImages ? (JSON.parse(body.removeImages as string) as string[]) : [];
    const remaining = keptUrls.filter((url) => !removeList.includes(url));
    if (remaining.length + files.length > 4) {
      throw new ApiError(400, 'A product can have at most 4 images.');
    }
    body.images = await uploadProductImages(files, remaining);
    delete body.removeImages;
  }

  Object.assign(product, body);
  await product.save();

  sendSuccess(res, 200, 'Product updated successfully.', { product });
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new ApiError(404, 'Product not found.'));

  await Promise.all(product.images.map((url) => deleteCloudinaryAsset(url)));
  await product.deleteOne();

  sendSuccess(res, 200, 'Product deleted successfully.');
});

export const getAllProductsAdmin = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = pagination(req);
  const filter: Record<string, unknown> = {};
  if (req.query.category) filter.category = req.query.category;
  if (req.query.search) filter.$text = { $search: String(req.query.search) };
  if (req.query.status === 'active') filter.isActive = true;
  if (req.query.status === 'inactive') filter.isActive = false;

  const [items, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);

  sendSuccess(res, 200, 'Products fetched (admin).', {
    products: items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const toggleProductStatus = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new ApiError(404, 'Product not found.'));

  product.isActive = typeof req.body.isActive === 'boolean' ? req.body.isActive : !product.isActive;
  await product.save();
  sendSuccess(res, 200, 'Product status updated.', { product });
});