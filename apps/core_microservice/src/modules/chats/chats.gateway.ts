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

export interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
  };
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
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
    try {
      const token =
        client.handshake.headers.cookie
          ?.split('access_token=')?.[1]
          ?.split(';')?.[0] ||
        client.handshake.headers.authorization?.split(' ')?.[1];

      if (!token) throw new Error('Unauthorized');

      const payload = await this.authService.validateToken(token);
      client.data.userId = payload.user.sub;

      const userChats = await this.chatsService.getUserChats(
        client.data.userId,
      );
      for (const chat of userChats) {
        await client.join(chat.id);
      }

      console.log(`🟢 Socket connected: ${client.data.userId}`);
    } catch (error) {
      console.log(`🔴 Socket rejected: ${error}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    console.log(`🔴 Socket disconnected: ${client.data.userId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { chatId: string; dto: SendMessageDto },
  ) {
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
      return { success: true };
    } catch {
      return { success: false, error: 'Failed to send message' };
    }
  }
  @SubscribeMessage('editMessage')
  async handleEditMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    payload: { chatId: string; messageId: string; dto: UpdateMessageDto },
  ) {
    const updated = await this.chatsService.editMessage(
      client.data.userId,
      payload.messageId,
      payload.dto.content,
    );
    this.server.to(payload.chatId).emit('messageEdited', updated);
  }

  @SubscribeMessage('deleteMessage')
  async handleDeleteMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { chatId: string; messageId: string },
  ) {
    const deleted = await this.chatsService.deleteMessage(
      client.data.userId,
      payload.messageId,
    );
    this.server.to(payload.chatId).emit('messageDeleted', deleted);
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
    this.server.to(chatId).emit('messageUpdated', message);
  }
}
