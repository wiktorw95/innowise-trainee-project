import { Module } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';
import { SharedPrismaModule } from '@innogram/shared';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [SharedPrismaModule, AuthModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
