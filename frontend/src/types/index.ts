export type Role = 'user' | 'manager' | 'admin';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  phone?: string;
  role: Role;
  emailVerified: boolean;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  finalPrice?: number;
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

export interface Address {
  _id: string;
  user: string;
  label: string;
  recipientName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  isDefault: boolean;
}

export interface Review {
  _id: string;
  product: string;
  user: { _id: string; firstName: string; lastName: string; avatar?: string } | string;
  rating: number;
  title?: string;
  comment: string;
  isApproved: boolean;
  createdAt: string;
}

export interface MyReview {
  _id: string;
  product: string;
  rating: number;
  title?: string;
  comment: string;
  isApproved: boolean;
  createdAt: string;
}

export interface OrderItem {
  product: string;
  name: string;
  image: string;
  unitPrice: number;
  quantity: number;
  size?: string;
  total: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user: string | { _id: string; firstName: string; lastName: string; email: string };
  items: OrderItem[];
  shippingAddress: Partial<Address>;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  totalAmount: number;
  currency: string;
  paymentReference?: string;
  paymentStatus: 'unpaid' | 'pending' | 'paid' | 'failed';
  orderStatus: 'pending' | 'processing' | 'shipped' | 'in_transit' | 'delivered' | 'cancelled' | 'refunded';
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  size?: string;
}

export interface Paginated {
  pagination: { page: number; limit: number; total: number; pages: number };
}

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