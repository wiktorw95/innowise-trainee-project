import {
  Controller,
  Get,
  Param,
  Res,
  NotFoundException,
  SetMetadata,
  StreamableFile,
} from '@nestjs/common';
import express from 'express';
import { join } from 'path';
import { createReadStream, existsSync } from 'fs';
import { AppLogger } from '@innogram/shared';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Controller('uploads')
export class UploadsController {
  @Public()
  @Get(':filename')
  getFile(
    @Param('filename') filename: string,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const filePath = join(process.cwd(), 'uploads', filename);

    if (!existsSync(filePath)) {
      AppLogger.error(
        `Missing file requested: ${filename}`,
        null,
        'UploadsController',
      );
      throw new NotFoundException('Image not found on disk');
    }

    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeType =
      ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : 'image/jpeg';

    res.set({
      'Content-Type': mimeType,
      'Cross-Origin-Resource-Policy': 'cross-origin',
    });

    AppLogger.debug(
      `Streaming image to browser: ${filename}`,
      null,
      'UploadsController',
    );

    const file = createReadStream(filePath);
    return new StreamableFile(file);
  }
}
