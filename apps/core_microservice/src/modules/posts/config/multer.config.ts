import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { v4 as uuid } from 'uuid';
import { Request } from 'express';
import { FileFilterCallback } from 'multer'; // 1. Imported official type

export const multerOptions = {
  fileFilter: (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback,
  ) => {
    if (file.mimetype.match(/\/(jpg|jpeg|png|gif|mp4)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'));
    }
  },
  storage: diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb) => {
      const uploadPath = './uploads';
      if (!existsSync(uploadPath)) {
        mkdirSync(uploadPath);
      }
      cb(null, uploadPath);
    },
    filename: (req: Request, file: Express.Multer.File, cb) => {
      cb(null, `${uuid()}${extname(file.originalname)}`);
    },
  }),
};
