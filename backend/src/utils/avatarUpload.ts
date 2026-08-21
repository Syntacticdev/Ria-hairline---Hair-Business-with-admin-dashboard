import { cloudinary } from '../config/cloudinary';
import { ApiError } from './ApiError';

export const uploadBufferIfAvatar = async (file: Express.Multer.File): Promise<string> => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!allowed.includes(file.mimetype)) {
    throw new ApiError(400, 'Avatar must be a jpg, png or webp image.');
  }
  const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
  try {
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'ria-hairline/avatars',
      resource_type: 'image',
      transformation: { width: 400, height: 400, crop: 'fill' },
    });
    return result.secure_url;
  } catch (err) {
    throw new ApiError(502, `Avatar upload failed: ${(err as Error).message}`);
  }
};