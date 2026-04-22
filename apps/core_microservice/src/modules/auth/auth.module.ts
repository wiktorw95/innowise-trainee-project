import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AccessGuard } from './access.guard.js';
import { SharedPrismaModule } from '@innogram/shared';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [HttpModule, ConfigModule, SharedPrismaModule],
  controllers: [AuthController],
  providers: [AuthService, AccessGuard],
  exports: [AuthService, AccessGuard],
})
export class AuthModule {}
