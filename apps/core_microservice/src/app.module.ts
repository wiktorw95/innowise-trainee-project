import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaService } from './prisma/prisma.service.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { PostsModule } from './modules/posts/posts.module.js';
import { CommentsModule } from './modules/comments/comments.module.js';
import { ChatsModule } from './modules/chats/chats.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    UsersModule,
    PostsModule,
    CommentsModule,
    ChatsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
