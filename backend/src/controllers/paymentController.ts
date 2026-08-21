import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { Types } from 'mongoose';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { Address } from '../models/Address';
import { PaymentTransaction } from '../models/PaymentTransaction';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { paystackInitialize, paystackVerify, isValidWebhookSignature } from '../utils/paystack';
import { isMongoId } from '../utils/validators';

const CURRENCY = 'NGN';
const DELIVERY_FEE = Number(process.env.DELIVERY_FEE ?? 0);
const MIN_ORDER = Number(process.env.MIN_ORDER_AMOUNT ?? 100);

const generateReference = (): string => `RH-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;

interface CheckoutItemInput {
  product: string;
  quantity: number;
  size?: string;
}

interface InitializeBody {
  items: CheckoutItemInput[];
  deliveryAddressId: string;
  callbackUrl?: string;
  notes?: string;
}

interface CheckoutPayload {
  items: {
    product: string;
    name: string;
    image: string;
    unitPrice: number;
    quantity: number;
    size?: string;
    total: number;
  }[];
  shippingAddress: {
    label?: string;
    recipientName?: string;
    phone?: string;
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  subtotal: number;
  deliveryFee: number;
  discount: number;
  totalAmount: number;
  currency: string;
  notes?: string;
  userEmail: string;
}

/**
 * Validates the cart against the database (server-side prices, stock) and
 * returns the checkout snapshot that will be turned into a real Order only
 * AFTER Paystack has verified the payment through the webhook.
 */
const buildCheckoutPayload = async (req: Request, body: InitializeBody): Promise<CheckoutPayload> => {
  if (!req.user) throw new ApiError(401, 'Not authorized.');
  const { items, deliveryAddressId, notes } = body;

  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, 'Your cart is empty.');
  }
  if (!isMongoId(deliveryAddressId)) {
    throw new ApiError(400, 'A valid delivery address is required.');
  }

  const address = await Address.findOne({ _id: deliveryAddressId, user: req.user._id });
  if (!address) throw new ApiError(404, 'Delivery address not found.');

  const normalizedItems: { productId: string; quantity: number; size?: string }[] = items.map((it) => ({
    productId: it.product,
    quantity: Math.max(1, Math.floor(Number(it.quantity) || 1)),
    size: it.size,
  }));

  const productIds = normalizedItems.map((it) => it.productId);
  const products = await Product.find({ _id: { $in: productIds }, isActive: true });
  if (products.length !== productIds.length) {
    throw new ApiError(400, 'One or more products in your cart are unavailable.');
  }

  const productMap = new Map<string, (typeof products)[number]>();
  products.forEach((p) => productMap.set(p._id.toString(), p));

  let subtotal = 0;
  const orderItems: CheckoutPayload['items'] = normalizedItems.map((it) => {
    const product = productMap.get(it.productId)!;
    if (product.stock < it.quantity) {
      throw new ApiError(400, `Only ${product.stock} left for "${product.name}".`);
    }
    const unitPrice = product.discountPrice ?? product.price;
    const total = Math.round(unitPrice * it.quantity * 100) / 100;
    subtotal += total;
    return {
      product: product._id.toString(),
      name: product.name,
      image: product.images[0],
      unitPrice,
      quantity: it.quantity,
      size: it.size,
      total,
    };
  });

  subtotal = Math.round(subtotal * 100) / 100;
  const totalAmount = Math.round((subtotal + DELIVERY_FEE) * 100) / 100;

  if (totalAmount < MIN_ORDER) {
    throw new ApiError(400, `Minimum order amount is ${CURRENCY} ${MIN_ORDER}.`);
  }

  return {
    items: orderItems,
    shippingAddress: {
      label: address.label,
      recipientName: address.recipientName,
      phone: address.phone,
      street: address.street,
      city: address.city,
      state: address.state,
      country: address.country,
      postalCode: address.postalCode,
    },
    subtotal,
    deliveryFee: DELIVERY_FEE,
    discount: 0,
    totalAmount,
    currency: CURRENCY,
    notes,
    userEmail: req.user.email,
  };
};

export const initializePayment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) throw new ApiError(401, 'Not authorized.');
  const { callbackUrl } = req.body as InitializeBody;

  const checkoutPayload = await buildCheckoutPayload(req, req.body as InitializeBody);

  const reference = generateReference();

  const init = await paystackInitialize({
    email: req.user.email,
    amount: Math.round(checkoutPayload.totalAmount * 100),
    reference,
    callback_url: callbackUrl,
    metadata: {
      reference,
      userId: req.user._id.toString(),
      userEmail: req.user.email,
      items: checkoutPayload.items.map((it) => ({
        name: it.name,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
      })),
      custom_fields: [
        { display_name: 'Order', variable_name: 'order_reference', value: reference },
      ],
    },
  });

  const transaction = await PaymentTransaction.create({
    user: req.user._id,
    reference,
    accessCode: init.access_code,
    amount: checkoutPayload.totalAmount,
    currency: CURRENCY,
    status: 'pending',
    gateway: 'paystack',
    initializePayload: {
      email: req.user.email,
      amount: Math.round(checkoutPayload.totalAmount * 100),
      reference,
      authorization_url: init.authorization_url,
    },
    checkoutPayload,
  });

  sendSuccess(res, 200, 'Checkout created. Complete payment on the Paystack page.', {
    authorizationUrl: init.authorization_url,
    reference,
    accessCode: init.access_code,
    transactionId: transaction._id,
  });
});

/**
 * Read-only payment status helper. The order itself is only ever persisted by
 * the verified webhook below — clients are never asked to confirm payments.
 */
export const verifyPayment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) throw new ApiError(401, 'Not authorized.');
  const reference = typeof req.query.reference === 'string' ? req.query.reference : undefined;
  if (!reference) throw new ApiError(400, 'Payment reference is required.');

  const transaction = await PaymentTransaction.findOne({ reference, user: req.user._id });
  if (!transaction) return next(new ApiError(404, 'Payment transaction not found.'));

  const order = await Order.findOne({ paymentReference: reference });
  return sendSuccess(res, 200, 'Payment status fetched.', {
    status: transaction.status,
    reference,
    order: order ?? null,
  });
});

/** Builds the Order document from the stored checkout snapshot (items + user details). */
const createOrderFromCheckout = async (
  reference: string,
  transaction: InstanceType<typeof PaymentTransaction>
) => {
  const existing = await Order.findOne({ paymentReference: reference });
  if (existing) return existing;

  const payload = (transaction.checkoutPayload ?? {}) as Partial<CheckoutPayload>;
  const items = payload.items ?? [];

  const order = await Order.create({
    orderNumber: reference,
    user: transaction.user,
    items: items.map((it) => ({
      product: new Types.ObjectId(it.product),
      name: it.name,
      image: it.image,
      unitPrice: it.unitPrice,
      quantity: it.quantity,
      size: it.size,
      total: it.total,
    })),
    shippingAddress: payload.shippingAddress ?? {},
    subtotal: payload.subtotal ?? 0,
    deliveryFee: payload.deliveryFee ?? 0,
    discount: payload.discount ?? 0,
    totalAmount: payload.totalAmount ?? 0,
    currency: payload.currency ?? CURRENCY,
    paymentReference: reference,
    paymentStatus: 'paid',
    orderStatus: 'processing',
    paymentMethod: 'paystack',
    notes: payload.notes,
  });

  await Promise.all(
    items.map(async (it) => {
      await Product.findByIdAndUpdate(it.product, {
        $inc: { stock: -it.quantity, soldCount: it.quantity },
      });
    })
  );

  return order;
};

export const paystackWebhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['x-paystack-signature'] as string | undefined;
  const rawBody = req.body;

  let bodyString: string;
  let event: { event?: string; data?: Record<string, unknown> };

  if (Buffer.isBuffer(rawBody)) {
    bodyString = rawBody.toString('utf8');
    event = JSON.parse(bodyString) as { event?: string; data?: Record<string, unknown> };
  } else {
    bodyString = JSON.stringify(rawBody);
    event = rawBody as { event?: string; data?: Record<string, unknown> };
  }

  if (!isValidWebhookSignature(bodyString, signature ?? '')) {
    throw new ApiError(401, 'Invalid Paystack signature.');
  }

  const eventData = event.data ?? {};
  const reference = typeof eventData.reference === 'string' ? eventData.reference : undefined;

  if (event.event === 'charge.success' && reference) {
    const transaction = await PaymentTransaction.findOne({ reference });
    if (transaction && !(await Order.exists({ paymentReference: reference }))) {
      const verify = await paystackVerify(reference);

      if (verify.status === 'success') {
        await createOrderFromCheckout(reference, transaction);
        transaction.status = 'success';
        transaction.verifyPayload = {
          ...(transaction.verifyPayload ?? {}),
          webhook: eventData,
          verified: verify as unknown as Record<string, unknown>,
        };
        transaction.paymentChannel = verify.channel;
        transaction.paidAt = verify.paid_at ? new Date(verify.paid_at) : new Date();
        await transaction.save();
      } else {
        transaction.status = 'failed';
        transaction.verifyPayload = { webhook: eventData };
        await transaction.save();
      }
    }
  }

  if (event.event === 'charge.failed' && reference) {
    await PaymentTransaction.findOneAndUpdate(
      { reference },
      { status: 'failed', verifyPayload: { webhook: eventData } }
    );
    await Order.findOneAndUpdate({ paymentReference: reference }, { paymentStatus: 'failed' });
  }

  if (event.event === 'charge.pending' && reference) {
    await PaymentTransaction.findOneAndUpdate({ reference }, { status: 'pending' });
  }

  res.status(200).json({ received: true });
});

// -------------------- ADMIN / MANAGER: TRANSACTION RECORD --------------------

export const getTransactions = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (typeof req.query.status === 'string' && req.query.status) filter.status = req.query.status;

  if (typeof req.query.search === 'string' && req.query.search) {
    filter.$or = [{ reference: { $regex: req.query.search, $options: 'i' } }];
  }

  const [transactionList, total, summary] = await Promise.all([
    PaymentTransaction.find(filter)
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    PaymentTransaction.countDocuments(filter),
    PaymentTransaction.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          successful: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
          successfulAmount: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, '$amount', 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          pendingAmount: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          failedAmount: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, '$amount', 0] } },
        },
      },
    ]),
  ]);

  const s = summary[0] ?? {};
  sendSuccess(res, 200, 'Transactions fetched (admin).', {
    transactions: transactionList,
    summary: {
      total: s.total ?? 0,
      totalAmount: s.totalAmount ?? 0,
      successful: s.successful ?? 0,
      successfulAmount: s.successfulAmount ?? 0,
      pending: s.pending ?? 0,
      pendingAmount: s.pendingAmount ?? 0,
      failed: s.failed ?? 0,
      failedAmount: s.failedAmount ?? 0,
    },
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});