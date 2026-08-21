import { Request, Response, NextFunction, RequestHandler } from 'express';
import { User, IUser } from '../models/User';
import { verifyToken } from '../utils/generateToken';
import { ApiError } from '../utils/ApiError';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export const protect: RequestHandler = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    let token = req.headers.authorization?.startsWith('Bearer') ? req.headers.authorization.split(' ')[1] : undefined;

    if (!token && req.cookies) {
      token = (req.cookies as Record<string, string>).token;
    }

    if (!token) {
      return next(new ApiError(401, 'Not authorized, please log in.'));
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select('+password');

    if (!user) {
      return next(new ApiError(401, 'User no longer exists.'));
    }
    if (!user.isActive) {
      return next(new ApiError(403, 'Your account has been deactivated.'));
    }

    req.user = user;
    next();
  } catch (err) {
    return next(new ApiError(401, `Not authorized, token invalid. ${(err as Error).message}`));
  }
};