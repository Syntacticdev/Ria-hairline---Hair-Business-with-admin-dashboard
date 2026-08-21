import express, { Application, Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import reviewRoutes from './routes/reviewRoutes';
import orderRoutes from './routes/orderRoutes';
import paymentRoutes from './routes/paymentRoutes';
import userRoutes from './routes/userRoutes';
import { notFound, errorHandler } from './middleware/error';
import { ApiError } from './utils/ApiError';

const app: Application = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

app.use(helmet());
app.use(
  cors({
    origin: [process.env.CLIENT_URL ?? 'http://localhost:5173', process.env.ADMIN_URL ?? 'http://localhost:5174'],
    credentials: true,
  })
);
app.use(morgan('dev'));

// Raw body needed for Paystack webhook signature verification
app.use('/api/payments/webhook', express.raw({ type: () => true }));

app.use(
  express.json({
    limit: '2mb',
  })
);
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());

app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'Ria Hairline API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);

app.use(notFound);

app.use((err: ApiError | Error, _req: Request, res: Response, _next: NextFunction) => {
  errorHandler(err, _req, res, _next);
});

export const server = http.createServer(app);
export default app;