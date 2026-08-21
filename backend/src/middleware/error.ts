import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

export const notFound = (req: Request, _res: Response, next: NextFunction) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler = (err: ApiError | Error, _req: Request, res: Response, _next: NextFunction) => {
  let error = err as ApiError;
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';

  if (err.name === 'CastError') {
    const castErr = err as unknown as { value: string; path: string };
    statusCode = 400;
    message = `Invalid value for ${castErr.path}: ${castErr.value}`;
  }

  if (err.name === 'ValidationError') {
    const validationErr = err as unknown as { errors: Record<string, { message: string }> };
    statusCode = 400;
    message = Object.values(validationErr.errors)
      .map((e) => e.message)
      .join(', ');
  }

  if ((err as { code?: number }).code === 11000) {
    const dupErr = err as unknown as { keyValue: Record<string, string> };
    const field = Object.keys(dupErr.keyValue ?? {})[0] ?? 'field';
    statusCode = 400;
    message = `Duplicate value for ${field}. Please use a different value.`;
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your session has expired. Please log in again.';
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {}),
  });
};