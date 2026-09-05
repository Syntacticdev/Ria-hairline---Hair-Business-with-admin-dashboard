import dotenv from "dotenv";
dotenv.config();
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

export interface JwtPayload {
  id: string;
  email: string;
  role: 'user' | 'manager' | 'admin';
}

export const generateToken = (payload: JwtPayload): string => {
  const secret = process.env.JWT_SECRET ?? 'dev_secret_change_me';
  return jwt.sign(payload, secret, {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as jwt.SignOptions['expiresIn'],
  });
};

export const verifyToken = (token: string): JwtPayload => {
  const secret = process.env.JWT_SECRET ?? 'dev_secret_change_me';
  return jwt.verify(token, secret) as JwtPayload;
};

export const toObjectId = (id: string): Types.ObjectId => new Types.ObjectId(id);