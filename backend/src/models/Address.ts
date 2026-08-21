import { Schema, model, Document, Types } from 'mongoose';

export interface IAddress extends Document {
  user: Types.ObjectId;
  label: string;
  recipientName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IAddress>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    label: { type: String, trim: true, maxlength: 50, default: 'Home' },
    recipientName: { type: String, required: true, trim: true, maxlength: 80 },
    phone: { type: String, required: true, trim: true },
    street: { type: String, required: true, trim: true, maxlength: 200 },
    city: { type: String, required: true, trim: true, maxlength: 80 },
    state: { type: String, required: true, trim: true, maxlength: 80 },
    country: { type: String, required: true, trim: true, default: 'Nigeria' },
    postalCode: { type: String, trim: true, maxlength: 20 },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Address = model<IAddress>('Address', addressSchema);