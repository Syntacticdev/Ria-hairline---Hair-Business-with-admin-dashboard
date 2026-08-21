import { Schema, model, Document, Types } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  category: string;
  images: string[];
  stock: number;
  brand?: string;
  unit?: string;
  sizes?: string[];
  isActive: boolean;
  isFeatured: boolean;
  createdBy: Types.ObjectId;
  soldCount: number;
  ratingsAverage: number;
  ratingsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0 },
    category: { type: String, required: true, trim: true, index: true },
    images: {
      type: [String],
      validate: {
        validator: (v: string[]) => v.length >= 1 && v.length <= 4,
        message: 'A product must have between 1 and 4 images',
      },
    },
    stock: { type: Number, required: true, min: 0, default: 0 },
    brand: { type: String, trim: true, maxlength: 80 },
    unit: { type: String, trim: true, maxlength: 40 },
    sizes: { type: [String] },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    soldCount: { type: Number, default: 0 },
    ratingsAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text', category: 'text', brand: 'text' });

productSchema.methods.toJSON = function () {
  const obj = this.toObject();
  if (obj.discountPrice) {
    obj.finalPrice = Math.round((obj.price - obj.discountPrice) * 100) / 100;
  }
  return obj;
};

export const Product = model<IProduct>('Product', productSchema);