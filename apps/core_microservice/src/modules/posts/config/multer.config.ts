import { diskStorage } from 'multer';
import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';

export const multerOptions = {
  storage: diskStorage({
    destination: './uploads',
    filename: (req, file, callback) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      callback(null, `${uniqueSuffix}${extname(file.originalname)}`);
    },
  }),
  fileFilter: (req: any, file: any, callback: any) => {
    if (file.mimetype.match(/\/(jpg|jpeg|png|gif|mp4)$/)) {
      callback(null, true);
    } else {
      callback(
        new BadRequestException(
          'Unsupported file type. Only images and MP4 allowed.',
        ),
        false,
      );
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 },
};
