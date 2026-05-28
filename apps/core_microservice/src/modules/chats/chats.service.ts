import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@innogram/shared';
import { CreateGroupChatDto, SendMessageDto } from './dto/chats.dto.js';

@Injectable()
export class ChatsService {
  constructor(private prisma: PrismaService) {}

  async getProfileByUserId(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId: userId },
    });
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  async createPrivateChat(userId: string, targetUsername: string) {
    const myProfile = await this.getProfileByUserId(userId);
    const targetProfile = await this.prisma.profile.findUnique({
      where: { username: targetUsername },
    });

    if (!targetProfile) throw new NotFoundException('Target user not found');
    if (myProfile.id === targetProfile.id)
      throw new BadRequestException('Cannot chat with yourself');

    const existingChat = await this.prisma.chat.findFirst({
      where: {
        type: 'private',
        AND: [
          { chatParticipants: { some: { profile: { userId: userId } } } },
          {
            chatParticipants: {
              some: { profile: { username: targetUsername } },
            },
          },
        ],
      },
      include: {
        chatParticipants: {
          include: { profile: { select: { username: true, avatarUrl: true } } },
        },
      },
    });

    if (existingChat) return existingChat;

    return this.prisma.chat.create({
      data: {
        name: 'Private Chat',
        description: '',
        type: 'private',
        created_by: userId,
        chatParticipants: {
          create: [
            {
              role: 'admin',
              created_by: userId,
              profile_id: myProfile.id,
            },
            {
              role: 'member',
              created_by: userId,
              profile_id: targetProfile.id,
            },
          ],
        },
      },
      include: {
        chatParticipants: {
          include: { profile: { select: { username: true, avatarUrl: true } } },
        },
      },
    });
  }

  async createGroupChat(userId: string, dto: CreateGroupChatDto) {
    const myProfile = await this.getProfileByUserId(userId);
    const targetProfiles = await this.prisma.profile.findMany({
      where: { username: { in: dto.participantUsernames } },
    });

    if (targetProfiles.length < 2)
      throw new BadRequestException(
        'Group chats require at least 3 total participants',
      );

    const participants = targetProfiles.map((p) => ({
      role: 'member',
      created_by: userId,
      profile_id: p.id,
    }));
    participants.push({
      role: 'admin',
      created_by: userId,
      profile_id: myProfile.id,
    });

    return this.prisma.chat.create({
      data: {
        name: dto.name,
        description: dto.description || '',
        type: 'group',
        created_by: userId,
        chatParticipants: { create: participants },
      },
      include: {
        chatParticipants: {
          include: { profile: { select: { username: true } } },
        },
      },
    });
  }

  async getUserChats(userId: string) {
    const profile = await this.getProfileByUserId(userId);
    return this.prisma.chat.findMany({
      where: { chatParticipants: { some: { profile_id: profile.id } } },
      include: {
        chatParticipants: {
          include: { profile: { select: { username: true, avatarUrl: true } } },
        },
        message: { orderBy: { created_at: 'desc' }, take: 1 },
      },
      orderBy: { updated_at: 'desc' },
    });
  }

  async getChatMessages(userId: string, chatId: string) {
    const profile = await this.getProfileByUserId(userId);

    const participant = await this.prisma.chat_Participants.findUnique({
      where: {
        profile_id_chat_id: { profile_id: profile.id, chat_id: chatId },
      },
    });
    if (!participant)
      throw new ForbiddenException('Not a participant of this chat');

    return this.prisma.message.findMany({
      where: { chat_id: chatId },
      orderBy: { created_at: 'asc' },
      include: {
        profiles: { select: { username: true, avatarUrl: true } },
        messagesAssets: { include: { assets: true } },
        parentMessages: {
          select: {
            content: true,
            deleted: true,
            profiles: { select: { username: true } },
          },
        },
      },
    });
  }

  async saveMessage(userId: string, chatId: string, dto: SendMessageDto) {
    const profile = await this.getProfileByUserId(userId);

    const participant = await this.prisma.chat_Participants.findUnique({
      where: {
        profile_id_chat_id: { profile_id: profile.id, chat_id: chatId },
      },
    });
    if (!participant) throw new ForbiddenException('Not a participant');

    return this.prisma.message.create({
      data: {
        chat_id: chatId,
        profile_id: profile.id,
        content: dto.content,
        reply_to_message_id: dto.replyToMessageId,
        created_by: userId,
      },
      include: {
        profiles: { select: { username: true, avatarUrl: true } },
        parentMessages: { select: { content: true, deleted: true } },
      },
    });
  }

  async editMessage(userId: string, messageId: string, content: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });
    if (!message || message.deleted)
      throw new NotFoundException('Message not found');
    if (message.created_by !== userId)
      throw new ForbiddenException('Not authorized');

    return this.prisma.message.update({
      where: { id: messageId },
      data: { content, is_edited: true, updated_by: userId },
      include: { profiles: { select: { username: true, avatarUrl: true } } },
    });
  }

  async deleteMessage(userId: string, messageId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });
    if (!message || message.deleted)
      throw new NotFoundException('Message not found');
    if (message.created_by !== userId)
      throw new ForbiddenException('Not authorized');

    return this.prisma.message.update({
      where: { id: messageId },
      data: { content: '', deleted: true, updated_by: userId },
    });
  }

  async addMessageAssets(
    userId: string,
    messageId: string,
    files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0)
      throw new BadRequestException('No files provided');
    if (files.length > 10)
      throw new BadRequestException('Max 10 files allowed');

    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { messagesAssets: true },
    });
    if (!message) throw new NotFoundException('Message not found');
    if (message.created_by !== userId)
      throw new ForbiddenException('Not authorized');

    return this.prisma.$transaction(async (tx) => {
      const assets = await Promise.all(
        files.map((file, i) =>
          tx.asset.create({
            data: {
              file_name: file.filename,
              file_path: file.path,
              file_type: file.mimetype,
              file_size: file.size,
              order_index: message.messagesAssets.length + i,
              created_by: userId,
            },
          }),
        ),
      );

      await tx.messages_Assets.createMany({
        data: assets.map((asset, i) => ({
          message_id: message.id,
          asset_id: asset.id,
          order_index: message.messagesAssets.length + i,
          created_by: userId,
        })),
      });

      return this.prisma.message.findUnique({
        where: { id: messageId },
        include: { messagesAssets: { include: { assets: true } } },
      });
    });
  }
}
