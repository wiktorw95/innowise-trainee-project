import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CommentsService } from './comments.service.js';
import { CreateCommentDto, UpdateCommentDto } from './dto/comments.dto.js';
import { AccessGuard } from '../auth/access.guard.js';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: {
    id: string;
    email?: string;
  };
}

@ApiTags('Comments')
@ApiBearerAuth()
@UseGuards(AccessGuard)
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('post/:postId')
  create(
    @Req() req: RequestWithUser,
    @Param('postId') postId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.createComment(req.user.id, postId, dto);
  }

  @Get('post/:postId')
  getForPost(@Param('postId') postId: string) {
    return this.commentsService.getPostComments(postId);
  }

  @Patch(':id')
  update(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.commentsService.updateComment(req.user.id, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.commentsService.deleteComment(req.user.id, id);
  }
}