import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { User, IUser } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { generateToken, JwtPayload } from '../utils/generateToken';
import { sendSuccess } from '../utils/ApiResponse';
import { isValidEmail } from '../utils/validators';

const EXPIRES_IN = Number(process.env.JWT_EXPIRES_IN?.replace('d', '')) || 7;
const TOKEN_DAYS = EXPIRES_IN;

const attachToken = (res: Response, user: IUser) => {
  const payload: JwtPayload = { id: user._id.toString(), email: user.email, role: user.role };
  const token = generateToken(payload);
  res.cookie('token', token, {
    httpOnly: true,
    maxAge: TOKEN_DAYS * 24 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  return { token, payload };
};

const authResponse = (user: IUser) => ({
  id: user._id.toString(),
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  avatar: user.avatar,
  phone: user.phone,
  role: user.role,
  emailVerified: user.emailVerified,
});

interface RegisterBody {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { firstName, lastName, email, password } = req.body as RegisterBody;

  if (!firstName || !lastName || !email || !password) {
    throw new ApiError(400, 'Please provide first name, last name, email and password.');
  }
  if (!isValidEmail(email)) {
    throw new ApiError(400, 'Please provide a valid email address.');
  }
  if (password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters long.');
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    throw new ApiError(409, 'An account already exists with this email. Please log in.');
  }

  const user = await User.create({
    firstName,
    lastName,
    email: email.toLowerCase(),
    password,
    role: 'user',
  });

  const { token } = attachToken(res, user);
  sendSuccess(res, 201, 'Account created successfully.', { user: authResponse(user), token });
});

interface LoginBody {
  email: string;
  password: string;
}

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginBody;

  if (!email || !password) {
    throw new ApiError(400, 'Please provide email and password.');
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !user.password) {
    throw new ApiError(401, 'Invalid email or password.');
  }
  if (user.googleId && await user.comparePassword(password) === false) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password.');
  }
  if (!user.isActive) {
    throw new ApiError(403, 'Your account has been deactivated. Contact support.');
  }

  const { token } = attachToken(res, user);
  sendSuccess(res, 200, 'Logged in successfully.', { user: authResponse(user), token });
});

export const googleAuth = asyncHandler(async (req: Request, res: Response) => {
  const { idToken } = req.body as { idToken?: string };

  if (!idToken) {
    throw new ApiError(400, 'Google id token is required.');
  }

  const tokenInfoResponse = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
  const tokenInfo = tokenInfoResponse.data as {
    email?: string;
    email_verified?: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
    sub?: string;
    aud?: string;
  };

  const expectedAudience = process.env.GOOGLE_CLIENT_ID;
  // if (expectedAudience && tokenInfo.aud && tokenInfo.aud !== expectedAudience) {
  //   throw new ApiError(401, 'Google token was issued for a different audience.');
  // }

  const email = tokenInfo.email?.toLowerCase();
  if (!email || tokenInfo.email_verified !== 'true') {
    throw new ApiError(401, 'Could not verify your Google account email.');
  }

  // Map by email — if a user already exists (email/password or google), link googleId.
  let user = await User.findOne({ email });
  if (user) {
    if (!user.googleId) {
      user.googleId = tokenInfo.sub;
      if (!user.isActive) {
        throw new ApiError(403, 'Your account has been deactivated.');
      }
      if (!user.emailVerified) user.emailVerified = true;
      await user.save();
    } else if (user.googleId !== tokenInfo.sub) {
      throw new ApiError(409, 'This email is already linked to another Google account.');
    }
  } else {
    user = await User.create({
      firstName: tokenInfo.given_name ?? 'Google',
      lastName: tokenInfo.family_name ?? 'User',
      email,
      googleId: tokenInfo.sub,
      avatar: tokenInfo.picture,
      emailVerified: true,
      role: 'user',
    });
  }

  const { token } = attachToken(res, user);
  sendSuccess(res, 200, 'Google login successful.', { user: authResponse(user), token });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie('token');
  sendSuccess(res, 200, 'Logged out successfully.');
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Not authorized.');
  }
  sendSuccess(res, 200, 'Profile fetched.', { user: authResponse(req.user) });
});

interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
}

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Not authorized.');
  }
  const { currentPassword, newPassword } = req.body as ChangePasswordBody;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, 'Please provide current and new password.');
  }
  if (newPassword.length < 8) {
    throw new ApiError(400, 'New password must be at least 8 characters long.');
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!user || !user.password) {
    throw new ApiError(400, 'This account uses Google sign-in and has no password. Set one via profile settings.');
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new ApiError(400, 'Current password is incorrect.');
  }

  user.password = newPassword;
  await user.save();

  sendSuccess(res, 200, 'Password changed successfully.');
});