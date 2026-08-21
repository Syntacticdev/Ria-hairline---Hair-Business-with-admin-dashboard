export type Role = 'user' | 'manager' | 'admin';

export interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  phone?: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface Product {
  _id: string;
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
  soldCount: number;
  ratingsAverage: number;
  ratingsCount: number;
  createdAt: string;
}

export interface Review {
  _id: string;
  product: { _id: string; name: string; images: string[] };
  user: { _id: string; firstName: string; lastName: string; email: string };
  rating: number;
  title?: string;
  comment: string;
  isApproved: boolean;
  createdAt: string;
}

export type OrderPaymentStatus = 'unpaid' | 'pending' | 'paid' | 'failed';
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'in_transit' | 'delivered' | 'cancelled' | 'refunded';

export interface Order {
  _id: string;
  orderNumber: string;
  user: { _id: string; firstName: string; lastName: string; email: string; phone?: string } | string;
  items: {
    product: string;
    name: string;
    image?: string;
    unitPrice: number;
    quantity: number;
    size?: string;
    total: number;
  }[];
  shippingAddress: Record<string, string | undefined>;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  totalAmount: number;
  currency: string;
  paymentReference?: string;
  paymentMethod?: string;
  paymentStatus: 'unpaid' | 'pending' | 'paid' | 'failed';
  orderStatus: 'pending' | 'processing' | 'shipped' | 'in_transit' | 'delivered' | 'cancelled' | 'refunded';
  notes?: string;
  createdAt: string;
}

export interface Stats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  lowStock: number;
  pendingReviews: number;
  recentOrders: Order[];
}

export interface PaymentTransaction {
  _id: string;
  user: { _id: string; firstName: string; lastName: string; email: string } | null;
  reference: string;
  accessCode?: string;
  amount: number;
  currency: string;
  paymentChannel?: string;
  status: 'pending' | 'success' | 'failed' | 'abandoned';
  gateway: string;
  paidAt?: string;
  createdAt: string;
}

export interface TransactionSummary {
  total: number;
  totalAmount: number;
  successful: number;
  successfulAmount: number;
  pending: number;
  pendingAmount: number;
  failed: number;
  failedAmount: number;
}