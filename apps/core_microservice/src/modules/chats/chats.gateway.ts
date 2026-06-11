import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatsService } from './chats.service.js';
import { AuthService } from '../auth/auth.service.js';
import { SendMessageDto, UpdateMessageDto } from './dto/chats.dto.js';
import { AppLogger } from '@innogram/shared';

export interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
  };
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  },
})
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;

  constructor(
    private chatsService: ChatsService,
    private authService: AuthService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    const ctx = 'WebSockets:Connection';
    try {
      const token =
        client.handshake.headers.cookie
          ?.split('access_token=')?.[1]
          ?.split(';')?.[0] ||
        client.handshake.headers.authorization?.split(' ')?.[1];

      if (!token) throw new Error('Unauthorized: No access token provided');

      const payload = await this.authService.validateToken(token);
      client.data.userId = payload.user.sub;

      const userChats = await this.chatsService.getUserChats(
        client.data.userId,
      );
      for (const chat of userChats) {
        await client.join(chat.id);
      }

      AppLogger.success(
        `🟢 Socket connected and authenticated for user: ${client.data.userId}`,
        ctx,
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      AppLogger.warn(`🔴 Socket connection rejected: ${errMsg}`, ctx);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    AppLogger.info(
      `🔴 Socket disconnected for user: ${client.data.userId || 'Unknown'}`,
      'WebSockets:Disconnect',
    );
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { chatId: string; dto: SendMessageDto },
  ) {
    const ctx = 'WebSockets:SendMessage';
    AppLogger.debug(
      `User ${client.data.userId} sending message to chat ${payload.chatId}`,
      null,
      ctx,
    );
    try {
      const message = await this.chatsService.saveMessage(
        client.data.userId,
        payload.chatId,
        payload.dto,
      );

      await this.chatsService['prisma'].chat.update({
        where: { id: payload.chatId },
        data: { updated_at: new Date() },
      });

      this.server.to(payload.chatId).emit('newMessage', message);
      AppLogger.success(
        `Message distributed to chat room ${payload.chatId}`,
        ctx,
      );
      return { success: true };
    } catch (error) {
      AppLogger.error(`Failed to dispatch message via WebSocket`, error, ctx);
      return { success: false, error: 'Failed to send message' };
    }
  }

  @SubscribeMessage('editMessage')
  async handleEditMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    payload: { chatId: string; messageId: string; dto: UpdateMessageDto },
  ) {
    const ctx = 'WebSockets:EditMessage';
    AppLogger.info(
      `User ${client.data.userId} editing message ${payload.messageId} in room ${payload.chatId}`,
      ctx,
    );
    try {
      const updated = await this.chatsService.editMessage(
        client.data.userId,
        payload.messageId,
        payload.dto.content,
      );
      this.server.to(payload.chatId).emit('messageEdited', updated);
    } catch (error) {
      AppLogger.error(`Failed to process message edit event`, error, ctx);
    }
  }

  @SubscribeMessage('deleteMessage')
  async handleDeleteMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { chatId: string; messageId: string },
  ) {
    const ctx = 'WebSockets:DeleteMessage';
    AppLogger.info(
      `User ${client.data.userId} deleting message ${payload.messageId} in room ${payload.chatId}`,
      ctx,
    );
    try {
      const deleted = await this.chatsService.deleteMessage(
        client.data.userId,
        payload.messageId,
      );
      this.server.to(payload.chatId).emit('messageDeleted', deleted);
    } catch (error) {
      AppLogger.error(`Failed to process message deletion event`, error, ctx);
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() chatId: string,
  ) {
    client
      .to(chatId)
      .emit('userTyping', { userId: client.data.userId, chatId });
  }

  broadcastMessageUpdate(chatId: string, message: any) {
    AppLogger.debug(
      `Broadcasting fallback message asset update to room: ${chatId}`,
      null,
      'WebSockets:Broadcast',
    );
    this.server.to(chatId).emit('messageUpdated', message);
  }
}
