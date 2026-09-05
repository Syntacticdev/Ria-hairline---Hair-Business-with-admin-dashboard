import { cloudinary } from '../config/cloudinary';
import { ApiError } from './ApiError';

export interface UploadedAsset {
  url: string;
  publicId: string;
}

const uploadBuffer = (file: Express.Multer.File, folder: string): Promise<UploadedAsset> => {
  return new Promise((resolve, reject) => {
    const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    cloudinary.uploader
      .upload(dataUri, {
        folder,
        resource_type: 'image',
      })
      .then((result) => {
        resolve({ url: result.secure_url, publicId: result.public_id });
      })
      .catch((err) => reject(new ApiError(502, `Cloudinary upload failed: ${(err as Error).message}`)));
  });
};

export const uploadProductImages = async (
  files: Express.Multer.File[],
  existingUrls: string[] = []
): Promise<string[]> => {
  const allowedCount = 4;
  const totalAfterAdd = existingUrls.length + files.length;
  if (totalAfterAdd > allowedCount) {
    throw new ApiError(400, `A product can have at most ${allowedCount} images. You provided ${totalAfterAdd}.`);
  }
  const uploaded = await Promise.all(files.map((file) => uploadBuffer(file, 'ria-hairline/products')));
  return [...existingUrls, ...uploaded.map((u) => u.url)];
};

export const deleteCloudinaryAsset = async (url: string): Promise<void> => {
  const publicId = extractPublicId(url);
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.log('Cloudinary delete failed:', (err as Error).message);
  }
};

const extractPublicId = (url: string): string | null => {
  const match = url.match(/ria-hairline\/products\/[^/]+/);
  if (!match) return null;
  const withoutFolder = match[0].replace('ria-hairline/products/', '');
  return `ria-hairline/products/${withoutFolder.split('.')[0]}`;
};