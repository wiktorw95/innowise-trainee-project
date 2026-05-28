import { Module } from '@nestjs/common';
import { ChatsService } from './chats.service.js';
import { ChatsController } from './chats.controller.js';
import { ChatsGateway } from './chats.gateway.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [ChatsController],
  providers: [ChatsService, ChatsGateway],
  exports: [ChatsService],
})
export class ChatsModule {}
