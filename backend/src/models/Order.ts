import { Schema, model, Document, Types } from 'mongoose';
import type { IAddress } from './Address';

export interface IOrderItem {
  product: Types.ObjectId;
  name: string;
  image: string;
  unitPrice: number;
  quantity: number;
  size?: string;
  total: number;
}

export type OrderPaymentStatus = 'unpaid' | 'pending' | 'paid' | 'failed';
export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface IOrder extends Document {
  orderNumber: string;
  user: Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: Partial<IAddress>;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  totalAmount: number;
  currency: string;
  paymentReference?: string;
  paymentStatus: OrderPaymentStatus;
  orderStatus: OrderStatus;
  paymentPayload?: Record<string, unknown>;
  paymentMethod: 'paystack';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        name: { type: String, required: true },
        image: { type: String },
        unitPrice: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        size: { type: String },
        total: { type: Number, required: true },
      },
    ],
    shippingAddress: {
      label: String,
      recipientName: String,
      phone: String,
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String,
    },
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: 'NGN' },
    paymentReference: { type: String, index: true },
    paymentStatus: { type: String, enum: ['unpaid', 'pending', 'paid', 'failed'], default: 'pending' },
    orderStatus: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'in_transit', 'delivered', 'cancelled', 'refunded'],
      default: 'pending',
    },
    paymentPayload: { type: Schema.Types.Mixed },
    paymentMethod: { type: String, default: 'paystack' },
    notes: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

export const Order = model<IOrder>('Order', orderSchema);