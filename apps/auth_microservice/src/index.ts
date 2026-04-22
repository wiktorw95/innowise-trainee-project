import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { AuthRoutes } from './routes/auth.routes.js';
import { AuthService } from './service/auth.service.js';
import { RedisRepository } from './repository/redis.repository.js';
import { PrismaService } from '@innogram/shared';
import { expressLogger } from './service/logger.common.js';

const bootstrap = async () => {
  const app = express();

  const prisma = new PrismaService();
  const redis = new RedisRepository();

  const authService = new AuthService(redis, prisma);
  const authController = new AuthRoutes(authService);

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(expressLogger);

  app.use('/internal/auth', authController.router);

  app.get('/health', (_, res) =>
    res.status(200).json({ status: 'ok', service: 'auth' })
  );

  app.use((err: any, req: any, res: any) => {
    const status = err.status || 500;
    res.status(status).json({
      success: false,
      message: err.message || 'Internal Server Error',
    });
  });

  const PORT = process.env.PORT || 3002;
  app.listen(PORT, () => {
    console.log(`🚀 Auth Microservice running on port ${PORT}`);
  });
};

bootstrap().catch((err) => {
  console.error('Fatal Error during bootstrap:', err);
  process.exit(1);
});
