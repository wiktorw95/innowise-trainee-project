import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreatePostDto } from './dto/create-post.dto.js';
import { UpdatePostDto } from './dto/update-post.dto.js';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    createPostDto: CreatePostDto,
    files: Express.Multer.File[],
  ) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId: userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found for this user');
    }

    const assetData =
      files?.map((file) => ({
        url: `/uploads/${file.filename}`,
        type: file.mimetype,
      })) || [];

    return this.prisma.post.create({
      data: {
        content: createPostDto.content || '',
        userId: userId,
        authorId: profile.id,
        assets: { create: assetData },
      },
      include: { assets: true },
    });
  }

  async getFeed(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const following = await this.prisma.follows.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);
    followingIds.push(userId);

    const posts = await this.prisma.post.findMany({
      where: { userId: { in: followingIds }, archived: false },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
      include: { assets: true, user: { select: { id: true, email: true } } },
    });

    const total = await this.prisma.post.count({
      where: { userId: { in: followingIds }, archived: false },
    });

    return {
      data: posts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async search(query: string) {
    return this.prisma.post.findMany({
      where: {
        content: { contains: query, mode: 'insensitive' },
        archived: false,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        assets: true,
        author: { select: { id: true, username: true } },
      },
    });
  }

  async update(postId: string, userId: string, updatePostDto: UpdatePostDto) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== userId)
      throw new UnauthorizedException('You can only edit your own posts');

    return this.prisma.post.update({
      where: { id: postId },
      data: updatePostDto,
    });
  }

  async archive(postId: string, userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId: userId },
    });

    const post = await this.prisma.post.findUnique({ where: { id: postId } });

    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== profile?.id) {
      throw new UnauthorizedException('You can only archive your own posts');
    }

    return this.prisma.post.update({
      where: { id: postId },
      data: { archived: true },
    });
  }

  async remove(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.userId !== userId)
      throw new UnauthorizedException('You can only remove your own posts');

    return this.prisma.post.delete({ where: { id: postId } });
  }
}
