import dotenv from "dotenv";
dotenv.config();
import crypto from "node:crypto"
import axios from 'axios';
import { ApiError } from './ApiError';

const BASE_URL = process.env.PAYSTACK_BASE_URL ?? 'https://api.paystack.co';
const SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export interface InitializePayload {
  email: string;
  amount: number;
  reference: string;
  callback_url?: string;
  metadata?: Record<string, unknown>;
}

const headers = () => {
  if (!SECRET_KEY) {
    throw new ApiError(500, 'Paystack secret key is not configured.');
  }
  return {
    Authorization: `Bearer ${SECRET_KEY}`,
    'Content-Type': 'application/json',
  };
};

export const paystackInitialize = async (payload: InitializePayload) => {
  try {
    const { data } = await axios.post(`${BASE_URL}/transaction/initialize`, payload, { headers: headers() });
    return data.data as {
      authorization_url: string;
      access_code: string;
      reference: string;
    };
  } catch (err) {
    const status = (err as { response?: { status?: number } }).response?.status ?? 500;
    const message =
      (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
      'Failed to initialize payment with Paystack.';
    throw new ApiError(status, message);
  }
};

export const paystackVerify = async (reference: string) => {
  try {
    const { data } = await axios.get(`${BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: headers(),
    });
    return data.data as {
      status: string;
      reference: string;
      amount: number;
      currency: string;
      paid_at?: string;
      channel?: string;
      customer?: { email?: string };
      gateway_response?: string;
    };
  } catch (err) {
    const status = (err as { response?: { status?: number } }).response?.status ?? 500;
    const message =
      (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
      'Failed to verify payment with Paystack.';
    throw new ApiError(status, message);
  }
};

export const isValidWebhookSignature = (rawBody: string, signature: string): boolean => {
  if (!SECRET_KEY) return false;
  const hash = crypto.createHmac('sha512', SECRET_KEY).update(rawBody).digest('hex');
  return hash === signature;
};