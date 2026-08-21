import multer from 'multer';
import { ApiError } from '../utils/ApiError';

const MEMORY_MAX = 5 * 1024 * 1024; // 5MB
const MAX_IMAGES = 4;

const storage = multer.memoryStorage();

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
  'image/gif': '.gif',
};

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (MIME_TO_EXT[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Only image files (jpg, png, webp, avif, gif) are allowed.'));
  }
};

export const productUpload = multer({
  storage,
  limits: { fileSize: MEMORY_MAX, files: MAX_IMAGES },
  fileFilter,
});

export { MAX_IMAGES, MEMORY_MAX };