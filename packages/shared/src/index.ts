import { Global, Module } from '@nestjs/common';
import PrismaService from './prisma/prisma.service.js';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class SharedPrismaModule {}

export * from './prisma/prisma.service.js';
export { default as PrismaService } from './prisma/prisma.service.js';
export * from '../generated/prisma/client.js';
