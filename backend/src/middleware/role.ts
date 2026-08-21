import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ApiError } from '../utils/ApiError';
import { UserRole } from '../models/User';

export const authorize = (...roles: UserRole[]): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return next(new ApiError(401, 'Not authorized, please log in.'));
    }
    if (!roles.includes(user.role)) {
      return next(new ApiError(403, 'You do not have permission to perform this action.'));
    }
    next();
  };
};

export const isAdminOrManager: RequestHandler = authorize('admin', 'manager');