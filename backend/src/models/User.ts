import { Schema, model, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'user' | 'manager' | 'admin';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  googleId?: string;
  avatar?: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  addresses: Types.ObjectId[];
  comparePassword(candidatePassword: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 50 },
    lastName: { type: String, required: true, trim: true, maxlength: 50 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, minlength: 8, select: false },
    googleId: { type: String, sparse: true },
    avatar: { type: String },
    phone: { type: String, trim: true },
    role: { type: String, enum: ['user', 'manager', 'admin'], default: 'user' },
    isActive: { type: Boolean, default: true },
    emailVerified: { type: Boolean, default: false },
    addresses: [{ type: Schema.Types.ObjectId, ref: 'Address' }],
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export const User = model<IUser>('User', userSchema);