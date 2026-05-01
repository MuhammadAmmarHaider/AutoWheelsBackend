import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import type { File as MulterFile } from 'multer';

interface CloudinaryUploadOptions {
  resource_type?: 'auto' | 'image' | 'video' | 'raw';
  folder?: string;
  public_id?: string;
  tags?: string[];
}

export interface UploadedFile {
  url: string;
  publicId: string;
  secureUrl: string;
}

@Injectable()
export class UploadService {
  constructor() {
    // Configure cloudinary with environment variables
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  /**
   * Upload a file to Cloudinary from a buffer
   */
  async uploadFile(
    file: MulterFile,
    options: CloudinaryUploadOptions = {},
  ): Promise<UploadedFile> {
    return new Promise((resolve, reject) => {
      const uploadOptions: CloudinaryUploadOptions = {
        resource_type: 'auto',
        folder: 'autowheels',
        ...options,
      };

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            reject(new Error(`Cloudinary upload failed: ${error.message}`));
          } else if (result) {
            resolve({
              url: result.url,
              secureUrl: result.secure_url,
              publicId: result.public_id,
            });
          } else {
            reject(new Error('Cloudinary upload returned empty result'));
          }
        },
      );

      // Convert file buffer to stream and pipe it to cloudinary
      const stream = Readable.from(file.buffer);
      stream.pipe(uploadStream);
    });
  }

  /**
   * Upload multiple files to Cloudinary
   */
  async uploadMultipleFiles(
    files: MulterFile[],
    options: CloudinaryUploadOptions = {},
  ): Promise<UploadedFile[]> {
    const uploadPromises = files.map((file) =>
      this.uploadFile(file, options),
    );
    return Promise.all(uploadPromises);
  }

  /**
   * Delete a file from Cloudinary by public ID
   */
  async deleteFile(publicId: string): Promise<{ result: string }> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          reject(new Error(`Cloudinary delete failed: ${error.message}`));
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * Delete multiple files from Cloudinary
   */
  async deleteMultipleFiles(publicIds: string[]): Promise<void> {
    const deletePromises = publicIds.map((id) => this.deleteFile(id));
    await Promise.all(deletePromises);
  }
}
