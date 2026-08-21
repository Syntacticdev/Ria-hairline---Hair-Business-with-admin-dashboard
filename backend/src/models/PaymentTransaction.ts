import { Schema, model, Document, Types } from 'mongoose';

export interface IPaymentTransaction extends Document {
  user: Types.ObjectId;
  reference: string;
  accessCode: string;
  amount: number;
  currency: string;
  paymentChannel?: string;
  status: 'pending' | 'success' | 'failed' | 'abandoned';
  gateway: 'paystack';
  initializePayload: Record<string, unknown>;
  verifyPayload?: Record<string, unknown>;
  checkoutPayload?: Record<string, unknown>;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const paymentTransactionSchema = new Schema<IPaymentTransaction>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reference: { type: String, required: true, unique: true, index: true },
    accessCode: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'NGN' },
    paymentChannel: { type: String },
    status: { type: String, enum: ['pending', 'success', 'failed', 'abandoned'], default: 'pending' },
    gateway: { type: String, default: 'paystack' },
    initializePayload: { type: Schema.Types.Mixed },
    verifyPayload: { type: Schema.Types.Mixed },
    checkoutPayload: { type: Schema.Types.Mixed },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

export const PaymentTransaction = model<IPaymentTransaction>('PaymentTransaction', paymentTransactionSchema);