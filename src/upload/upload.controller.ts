import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { File as MulterFile } from 'multer';
import { UploadService } from './upload.service';
import { JwtGuard } from '../auth/guard';

@Controller('upload')
export class UploadController {
  constructor(private uploadService: UploadService) {}
// Endpoint for uploading multiple images (up to 8 files, max 10MB each)
  @UseGuards(JwtGuard)
  @Post('images')
  @UseInterceptors(
    FilesInterceptor('files', 8, {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit per file
      },
      fileFilter: (_req, file, cb) => {
        // Only allow image files
        if (!file.mimetype.startsWith('image/')) {
          cb(new BadRequestException('Only image files are allowed'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  async uploadImages(
    @UploadedFiles() files: MulterFile[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    try {
      const uploadedFiles = await this.uploadService.uploadMultipleFiles(files, {
        folder: 'autowheels/listings',
        tags: ['listing', 'car'],
      });

      return {
        success: true,
        data: uploadedFiles.map((file) => ({
          url: file.secureUrl,
          publicId: file.publicId,
        })),
      };
    } catch (error) {
      throw new BadRequestException(
        `File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
