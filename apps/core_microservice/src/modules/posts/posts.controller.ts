import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PostsService } from './posts.service.js';
import { CreatePostDto, UpdatePostDto, FeedQueryDto } from './dto/posts.dto.js';
import { AccessGuard } from '../auth/access.guard.js';
import {
  ApiTags,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiOperation,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuid } from 'uuid';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: {
    id: string;
    email?: string;
  };
}

const uploadInterceptor = FilesInterceptor('files', 10, {
  storage: diskStorage({
    destination: process.env.UPLOAD_PATH || './uploads',
    filename: (_, file, cb) =>
      cb(null, `${uuid()}${extname(file.originalname)}`),
  }),
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10) },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|mp4|webm)$/)) {
      return cb(
        new BadRequestException('Only image and video files are allowed!'),
        false,
      );
    }
    cb(null, true);
  },
});

@ApiTags('Posts')
@ApiBearerAuth()
@UseGuards(AccessGuard)
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Post text content' },
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Upload up to 10 images or videos',
        },
      },
    },
  })
  @UseInterceptors(uploadInterceptor)
  create(
    @Req() req: RequestWithUser,
    @Body() dto: CreatePostDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.postsService.createPost(req.user.id, dto, files);
  }

  @Get('feed')
  @ApiOperation({ summary: 'Get user home feed with optional tab filtering' })
  async getFeed(@Req() req: RequestWithUser, @Query() query: FeedQueryDto) {
    const { tab } = query;

    if (tab === 'liked') {
      return this.postsService.getInteractedPosts(req.user.id, query, 'liked');
    }

    if (tab === 'commented') {
      return this.postsService.getInteractedPosts(
        req.user.id,
        query,
        'commented',
      );
    }

    if (tab === 'archived') {
      return this.postsService.getMyPosts(req.user.id, query, true);
    }

    return this.postsService.getFeed(req.user.id, query);
  }

  @Get('me')
  getMyPosts(@Req() req: RequestWithUser, @Query() query: FeedQueryDto) {
    return this.postsService.getMyPosts(req.user.id, query, false);
  }

  @Get('me/archived')
  getArchivedPosts(@Req() req: RequestWithUser, @Query() query: FeedQueryDto) {
    return this.postsService.getMyPosts(req.user.id, query, true);
  }

  @Get('me/liked')
  getLikedPosts(@Req() req: RequestWithUser, @Query() query: FeedQueryDto) {
    return this.postsService.getInteractedPosts(req.user.id, query, 'liked');
  }

  @Get('me/commented')
  getCommentedPosts(@Req() req: RequestWithUser, @Query() query: FeedQueryDto) {
    return this.postsService.getInteractedPosts(
      req.user.id,
      query,
      'commented',
    );
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get public posts for a specific user' })
  getUserPosts(@Param('userId') userId: string) {
    return this.postsService.getUserPosts(userId);
  }

  @Get(':id')
  getPostById(@Param('id') id: string) {
    return this.postsService.getPostById(id);
  }

  @Patch(':id')
  update(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
  ) {
    return this.postsService.updatePost(req.user.id, id, dto);
  }

  @Post(':id/assets')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Upload additional images or videos',
        },
      },
    },
  })
  @UseInterceptors(uploadInterceptor)
  addAssets(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.postsService.addPostAssets(req.user.id, id, files || []);
  }

  @Delete(':id/assets/:assetId')
  removeAsset(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Param('assetId') assetId: string,
  ) {
    return this.postsService.removePostAsset(req.user.id, id, assetId);
  }

  @Delete(':id')
  remove(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.postsService.deletePost(req.user.id, id);
  }

  @Post(':id/like')
  toggleLike(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.postsService.toggleLike(req.user.id, id);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Get comments and replies for a post' })
  getComments(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.postsService.getComments(req.user.id, id);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add a comment or reply to a post' })
  addComment(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Body() body: { content: string; parent_comment_id?: string },
  ) {
    if (!body.content?.trim())
      throw new BadRequestException('Comment cannot be empty');
    return this.postsService.addComment(
      req.user.id,
      id,
      body.content,
      body.parent_comment_id,
    );
  }

  @Post('comments/:commentId/like')
  @ApiOperation({ summary: 'Toggle like on a comment' })
  toggleCommentLike(
    @Req() req: RequestWithUser,
    @Param('commentId') commentId: string,
  ) {
    return this.postsService.toggleCommentLike(req.user.id, commentId);
  }

  @Patch('comments/:commentId')
  @ApiOperation({ summary: 'Edit a comment' })
  updateComment(
    @Req() req: RequestWithUser,
    @Param('commentId') commentId: string,
    @Body() body: { content: string },
  ) {
    if (!body.content?.trim())
      throw new BadRequestException('Content cannot be empty');
    return this.postsService.updateComment(
      req.user.id,
      commentId,
      body.content,
    );
  }

  @Delete('comments/:commentId')
  @ApiOperation({ summary: 'Delete a comment' })
  deleteComment(
    @Req() req: RequestWithUser,
    @Param('commentId') commentId: string,
  ) {
    return this.postsService.deleteComment(req.user.id, commentId);
  }
}
