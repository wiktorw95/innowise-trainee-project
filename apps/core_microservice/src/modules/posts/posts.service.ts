import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService, Prisma } from '@innogram/shared';
import { CreatePostDto, UpdatePostDto, FeedQueryDto } from './dto/posts.dto.js';
import * as fs from 'fs';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  private async getUserProfile(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId: userId },
    });
    if (!profile) throw new NotFoundException('User not found');
    return profile;
  }

  async createPost(
    userId: string,
    dto: CreatePostDto,
    files?: Express.Multer.File[],
  ) {
    const profile = await this.getUserProfile(userId);

    return this.prisma.$transaction(async (tx) => {
      const post = await tx.post.create({
        data: {
          content: dto.content,
          profileId: profile.id,
          created_by: userId,
        },
      });

      if (files && files.length > 0) {
        if (files.length > 10)
          throw new BadRequestException('Maximum 10 files allowed');
        const assets = await Promise.all(
          files.map((file, index) =>
            tx.asset.create({
              data: {
                file_name: file.filename,
                file_path: file.path,
                file_type: file.mimetype,
                file_size: file.size,
                order_index: index,
                created_by: userId,
              },
            }),
          ),
        );

        await tx.posts_Assets.createMany({
          data: assets.map((asset, index) => ({
            post_id: post.id,
            asset_id: asset.id,
            order_index: index,
            created_by: userId,
          })),
        });
      }
      return post;
    });
  }

  async getFeed(userId: string, query: FeedQueryDto) {
    const profile = await this.getUserProfile(userId);
    const skip = (query.page! - 1) * query.limit!;

    const following = await this.prisma.profiles_Follows.findMany({
      where: { follower_profile_id: profile.id, accepted: true },
      select: { followed_profile_id: true },
    });

    const followedIds = following.map((f) => f.followed_profile_id);
    followedIds.push(profile.id);

    const whereClause: Prisma.PostWhereInput = {
      profileId: { in: followedIds },
      isArchived: false,
    };

    if (query.search) {
      whereClause.content = { contains: query.search, mode: 'insensitive' };
    }

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: whereClause,
        orderBy: { created_at: 'desc' },
        skip,
        take: query.limit,
        include: {
          profile: {
            select: { username: true, displayName: true, avatarUrl: true },
          },
          postsAssets: { include: { assets: true } },
          _count: { select: { postsLikes: true, comment: true } },
        },
      }),
      this.prisma.post.count({ where: whereClause }),
    ]);

    return {
      data: posts,
      meta: { total, page: query.page, limit: query.limit },
    };
  }

  async getMyPosts(
    userId: string,
    query: FeedQueryDto,
    isArchived: boolean = false,
  ) {
    const profile = await this.getUserProfile(userId);
    const skip = (query.page! - 1) * query.limit!;

    const whereClause: Prisma.PostWhereInput = {
      profileId: profile.id,
      isArchived,
    };
    if (query.search)
      whereClause.content = { contains: query.search, mode: 'insensitive' };

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: whereClause,
        orderBy: { created_at: 'desc' },
        skip,
        take: query.limit,
        include: { postsAssets: { include: { assets: true } } },
      }),
      this.prisma.post.count({ where: whereClause }),
    ]);

    return {
      data: posts,
      meta: { total, page: query.page, limit: query.limit },
    };
  }

  async getInteractedPosts(
    userId: string,
    query: FeedQueryDto,
    type: 'liked' | 'commented',
  ) {
    const profile = await this.getUserProfile(userId);
    const skip = (query.page! - 1) * query.limit!;

    const whereClause: Prisma.PostWhereInput = { isArchived: false };
    if (type === 'liked')
      whereClause.postsLikes = { some: { profile_id: profile.id } };
    if (type === 'commented')
      whereClause.comment = { some: { profile_id: profile.id } };

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: whereClause,
        orderBy: { created_at: 'desc' },
        skip,
        take: query.limit,
        include: {
          profile: { select: { username: true } },
          postsAssets: { include: { assets: true } },
        },
      }),
      this.prisma.post.count({ where: whereClause }),
    ]);
    return {
      data: posts,
      meta: { total, page: query.page, limit: query.limit },
    };
  }

  async getPostById(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId, isArchived: false },
      include: {
        profile: {
          select: { username: true, displayName: true, avatarUrl: true },
        },
        postsAssets: { include: { assets: true } },
        _count: { select: { postsLikes: true, comment: true } },
      },
    });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }
  async updatePost(userId: string, postId: string, dto: UpdatePostDto) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.created_by !== userId)
      throw new NotFoundException('Not Authorized');

    return this.prisma.post.update({
      where: { id: postId },
      data: { ...dto, updated_by: userId },
    });
  }

  async addPostAssets(
    userId: string,
    postId: string,
    files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided for upload');
    }

    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { postsAssets: true },
    });
    if (!post) throw new NotFoundException('Post not found');
    if (post.created_by !== userId)
      throw new NotFoundException('Not Authorized');

    if (post.postsAssets.length + files.length > 10)
      throw new BadRequestException('Maximum 10 files allowed in total');

    return this.prisma.$transaction(async (tx) => {
      const startIndex = post.postsAssets.length;
      const assets = await Promise.all(
        files.map((file, i) =>
          tx.asset.create({
            data: {
              file_name: file.filename,
              file_path: file.path,
              file_type: file.mimetype,
              file_size: file.size,
              order_index: startIndex + i,
              created_by: userId,
            },
          }),
        ),
      );
      await tx.posts_Assets.createMany({
        data: assets.map((asset, i) => ({
          post_id: post.id,
          asset_id: asset.id,
          order_index: startIndex + i,
          created_by: userId,
        })),
      });
      return { success: true, added: assets.length };
    });
  }

  async removePostAsset(userId: string, postId: string, assetId: string) {
    const postAsset = await this.prisma.posts_Assets.findUnique({
      where: { post_id_asset_id: { post_id: postId, asset_id: assetId } },
      include: { posts: true, assets: true },
    });

    if (!postAsset) throw new NotFoundException('Asset not found on this post');
    if (postAsset.posts.created_by !== userId)
      throw new ForbiddenException('Not authorized');

    if (fs.existsSync(postAsset.assets.file_path))
      fs.unlinkSync(postAsset.assets.file_path);

    await this.prisma.$transaction([
      this.prisma.posts_Assets.delete({
        where: { post_id_asset_id: { post_id: postId, asset_id: assetId } },
      }),
      this.prisma.asset.delete({ where: { id: assetId } }),
    ]);
    return { success: true };
  }

  async deletePost(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { postsAssets: { include: { assets: true } } },
    });
    if (!post) throw new NotFoundException('Post not found');
    if (post.created_by !== userId)
      throw new ForbiddenException('Not authorized');

    post.postsAssets.forEach((pa) => {
      if (fs.existsSync(pa.assets.file_path))
        fs.unlinkSync(pa.assets.file_path);
    });

    await this.prisma.post.delete({ where: { id: postId } });
    return { success: true };
  }

  async toggleLike(userId: string, postId: string) {
    const profile = await this.getUserProfile(userId);
    const existingLike = await this.prisma.posts_Likes.findUnique({
      where: {
        post_id_profile_id: { post_id: postId, profile_id: profile.id },
      },
    });

    if (existingLike) {
      await this.prisma.posts_Likes.delete({
        where: {
          post_id_profile_id: { post_id: postId, profile_id: profile.id },
        },
      });
      return { liked: false };
    } else {
      await this.prisma.posts_Likes.create({
        data: { post_id: postId, profile_id: profile.id, created_by: userId },
      });
      return { liked: true };
    }
  }
}
