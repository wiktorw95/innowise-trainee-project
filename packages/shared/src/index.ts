import { Global, Module } from '@nestjs/common';
import PrismaService from './prisma/prisma.service.js';
import { AppLogger } from './utils/logger.js';

@Global()
@Module({
  providers: [PrismaService, AppLogger],
  exports: [PrismaService, AppLogger],
})
export class SharedPrismaModule {}

export * from './prisma/prisma.service.js';
export { default as PrismaService } from './prisma/prisma.service.js';
export * from '../generated/prisma/client.js';
export * from './utils/logger.js';
