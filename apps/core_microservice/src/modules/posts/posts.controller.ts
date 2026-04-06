import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  Query, UseInterceptors, UploadedFiles, Req, DefaultValuePipe, ParseIntPipe, UseGuards
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PostsService } from './posts.service.js';
import { CreatePostDto } from './dto/create-post.dto.js';
import { UpdatePostDto } from './dto/update-post.dto.js';
import { multerOptions } from './config/multer.config.js';
import { AuthGuard } from '../auth/auth.guard.js'

@UseGuards(AuthGuard)
@Controller('posts')
export class PostsController {
  constructor (private readonly postsService: PostsService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files', 10, multerOptions))
  create(
    @Req() req: any,
    @Body() createPostDto: CreatePostDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.postsService.create(req.user.userId, createPostDto, files);
  }

  @Get('feed')
  getFeed(
    @Req() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.postsService.getFeed(req.user.userId, page, limit);
  }

  @Get('search')
  search(@Query('q') query: string) {
    if (!query) return [];
    return this.postsService.search(query);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Req() req: any, @Body() updatePostDto: UpdatePostDto) {
    return this.postsService.update(id, req.user.userId, updatePostDto);
  }

  @Patch(':id/archive')
  archive(@Param('id') id: string, @Req() req: any) {
    return this.postsService.archive(id, req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.postsService.remove(id, req.user.userId);
  }


}
