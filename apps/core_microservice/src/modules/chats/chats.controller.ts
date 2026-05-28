import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ChatsService } from './chats.service.js';
import { ChatsGateway } from './chats.gateway.js';
import { CreatePrivateChatDto, CreateGroupChatDto } from './dto/chats.dto.js';
import { AccessGuard } from '../auth/access.guard.js';
import type { RequestWithUser } from '../auth/access.guard.js';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuid } from 'uuid';

const uploadInterceptor = FilesInterceptor('files', 10, {
  storage: diskStorage({
    destination: process.env.UPLOAD_PATH || './uploads',
    filename: (_, file, cb) =>
      cb(null, `${uuid()}${extname(file.originalname)}`),
  }),
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') },
});

@ApiTags('Chats')
@ApiBearerAuth()
@UseGuards(AccessGuard)
@Controller('Chats')
export class ChatsController {
  constructor(
    private readonly chatsService: ChatsService,
    private readonly chatsGateway: ChatsGateway,
  ) {}

  @Post('private')
  createPrivate(
    @Req() req: RequestWithUser,
    @Body() dto: CreatePrivateChatDto,
  ) {
    return this.chatsService.createPrivateChat(req.user.id, dto.targetUsername);
  }

  @Post('group')
  createGroup(@Req() req: RequestWithUser, @Body() dto: CreateGroupChatDto) {
    return this.chatsService.createGroupChat(req.user.id, dto);
  }

  @Get()
  getMyChats(@Req() req: RequestWithUser) {
    return this.chatsService.getUserChats(req.user.id);
  }

  @Get(':id/messages')
  getMessages(@Req() req: RequestWithUser, @Param('id') chatId: string) {
    return this.chatsService.getChatMessages(req.user.id, chatId);
  }

  @Post('messages/:messageId/assets')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
      },
    },
  })
  @UseInterceptors(uploadInterceptor)
  async uploadAssets(
    @Req() req: RequestWithUser,
    @Param('messageId') messageId: string,
    @Body('chatId') chatId: string,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    const updatedMessage = await this.chatsService.addMessageAssets(
      req.user.id,
      messageId,
      files || [],
    );

    if (chatId)
      this.chatsGateway.broadcastMessageUpdate(chatId, updatedMessage);

    return updatedMessage;
  }
}
