import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';

import { AuthRoutes } from './routes/auth.routes.js';
import { AuthService } from './service/auth.service.js';
import { RedisRepository } from './repository/redis.repository.js';
import { PrismaService } from '@innogram/shared';
import rateLimit from 'express-rate-limit';

const bootstrap = async () => {
  const app = express();

  const prisma = new PrismaService();
  const redis = new RedisRepository();

  const authService = new AuthService(redis, prisma);
  const authController = new AuthRoutes(authService);

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    })
  );
  app.use(express.json());

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
      success: false,
      message: 'Too many login attempts, please try again after 15 minutes',
    },
  });
  app.use('/auth/login', loginLimiter);

  app.use('/auth', authController.router);

  app.get('/health', (_, res) =>
    res.status(200).json({ status: 'ok', service: 'auth' })
  );

  app.use(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (err: any, req: Request, res: Response, _next: NextFunction): void => {
      const status = err.status || err.statusCode || 500;
      console.error(`[Error] ${req.method} ${req.path} -`, err.message);

      res.status(status).json({
        success: false,
        error: err.name || 'Error',
        message: err.message || 'Internal Server Error',
      });
    }
  );

  const PORT = process.env.PORT || 3002;
  app.listen(PORT, () => {
    console.log(`🚀 Auth Microservice running on port ${PORT}`);
  });
};

bootstrap().catch((err) => {
  console.error('Fatal Error during bootstrap:', err);
  process.exit(1);
});
