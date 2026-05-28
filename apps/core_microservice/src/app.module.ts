import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { PostsModule } from './modules/posts/posts.module.js';
import { CommentsModule } from './modules/comments/comments.module.js';
import { ChatsModule } from './modules/chats/chats.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { ConfigModule } from '@nestjs/config';
import { SharedPrismaModule } from '@innogram/shared';
import { APP_GUARD } from '@nestjs/core';
import { AccessGuard } from './modules/auth/access.guard.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    SharedPrismaModule,
    AuthModule,
    UsersModule,
    PostsModule,
    CommentsModule,
    ChatsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AccessGuard,
    },
  ],
})
export class AppModule {}
