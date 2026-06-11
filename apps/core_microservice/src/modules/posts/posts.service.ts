import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService, Prisma, AppLogger } from '@innogram/shared';
import { CreatePostDto, UpdatePostDto, FeedQueryDto } from './dto/posts.dto.js';
import * as fs from 'fs';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  private async getUserProfile(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId: userId },
    });
    if (!profile) {
      AppLogger.warn(
        `Profile lookup failed: No profile found for userId ${userId}`,
        'PostsService:ProfileCheck',
      );
      throw new NotFoundException('User not found');
    }
    return profile;
  }

  async createPost(
    userId: string,
    dto: CreatePostDto,
    files?: Express.Multer.File[],
  ) {
    const ctx = 'PostsService:CreatePost';
    AppLogger.info(
      `User ${userId} initiating post creation with ${files?.length || 0} attached files`,
      ctx,
    );

    const profile = await this.getUserProfile(userId);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const post = await tx.post.create({
          data: {
            content: dto.content,
            profileId: profile.id,
            created_by: userId,
          },
        });

        if (files && files.length > 0) {
          if (files.length > 10) {
            AppLogger.warn(
              `Post creation aborted: User ${userId} attempted to upload ${files.length} files (Max: 10)`,
              ctx,
            );
            throw new BadRequestException('Maximum 10 files allowed');
          }

          AppLogger.debug(
            `Provisioning DB asset records for post ID: ${post.id}`,
            null,
            ctx,
          );
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

        AppLogger.success(
          `Successfully published post ${post.id} for user ${userId}`,
          ctx,
        );
        return post;
      });
    } catch (error) {
      AppLogger.error(
        `Database transaction failed during post generation for user ${userId}`,
        error,
        ctx,
      );
      throw error;
    }
  }

  async getFeed(userId: string, query: FeedQueryDto) {
    const ctx = 'PostsService:GetFeed';
    AppLogger.debug(
      `Compiling home feed matrix for user: ${userId}`,
      query,
      ctx,
    );

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

    AppLogger.success(
      `Retrieved ${posts.length} feed posts (Total matched: ${total}) for user ${userId}`,
      ctx,
    );
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
    const ctx = 'PostsService:GetMyPosts';
    AppLogger.debug(
      `Fetching target personal posts for user: ${userId} (Archived state: ${isArchived})`,
      query,
      ctx,
    );

    const profile = await this.getUserProfile(userId);
    const skip = (query.page! - 1) * query.limit!;

    const whereClause: Prisma.PostWhereInput = {
      profileId: profile.id,
      isArchived,
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
    AppLogger.debug(
      `Fetching user metrics for interaction track: ${type} by user ${userId}`,
      query,
      'PostsService:Interacted',
    );
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
    AppLogger.debug(
      `Looking up isolated post context for ID: ${postId}`,
      null,
      'PostsService:GetPostById',
    );
    const post = await this.prisma.post.findFirst({
      where: { id: postId, isArchived: false },
      include: {
        profile: {
          select: { username: true, displayName: true, avatarUrl: true },
        },
        postsAssets: { include: { assets: true } },
        _count: { select: { postsLikes: true, comment: true } },
      },
    });
    if (!post) {
      AppLogger.warn(
        `Post lookup failed: Post ${postId} does not exist or is archived`,
        'PostsService:GetPostById',
      );
      throw new NotFoundException('Post not found');
    }
    return post;
  }

  async updatePost(userId: string, postId: string, dto: UpdatePostDto) {
    const ctx = 'PostsService:UpdatePost';
    AppLogger.info(
      `User ${userId} requested update structural changes for post: ${postId}`,
      ctx,
    );

    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.created_by !== userId) {
      AppLogger.warn(
        `Unauthorized mutation attempt by user ${userId} on post owned by ${post.created_by}`,
        ctx,
      );
      throw new ForbiddenException('Not Authorized');
    }

    const updatedPost = await this.prisma.post.update({
      where: { id: postId },
      data: { ...dto, updated_by: userId },
    });
    AppLogger.success(
      `Successfully structural updated post content for: ${postId}`,
      ctx,
    );
    return updatedPost;
  }

  async addPostAssets(
    userId: string,
    postId: string,
    files: Express.Multer.File[],
  ) {
    const ctx = 'PostsService:AddAssets';
    AppLogger.info(
      `User ${userId} adding supplementary assets to existing post: ${postId}`,
      ctx,
    );

    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided for upload');
    }

    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { postsAssets: true },
    });
    if (!post) throw new NotFoundException('Post not found');
    if (post.created_by !== userId)
      throw new ForbiddenException('Not Authorized');

    if (post.postsAssets.length + files.length > 10) {
      AppLogger.warn(
        `Asset patch rejected: Post asset ceiling limit breached (Max 10 total files)`,
        ctx,
      );
      throw new BadRequestException('Maximum 10 files allowed in total');
    }

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
      AppLogger.success(
        `Appended ${assets.length} new structural assets successfully onto post: ${postId}`,
        ctx,
      );
      return { success: true, added: assets.length };
    });
  }

  async removePostAsset(userId: string, postId: string, assetId: string) {
    const ctx = 'PostsService:RemoveAsset';
    AppLogger.info(
      `User ${userId} clearing asset ${assetId} off post ${postId}`,
      ctx,
    );

    const postAsset = await this.prisma.posts_Assets.findUnique({
      where: { post_id_asset_id: { post_id: postId, asset_id: assetId } },
      include: { posts: true, assets: true },
    });

    if (!postAsset) throw new NotFoundException('Asset not found on this post');
    if (postAsset.posts.created_by !== userId)
      throw new ForbiddenException('Not authorized');

    if (fs.existsSync(postAsset.assets.file_path)) {
      fs.unlinkSync(postAsset.assets.file_path);
      AppLogger.debug(
        `Purged binary media file track off storage path: ${postAsset.assets.file_path}`,
        null,
        ctx,
      );
    }

    await this.prisma.$transaction([
      this.prisma.posts_Assets.delete({
        where: { post_id_asset_id: { post_id: postId, asset_id: assetId } },
      }),
      this.prisma.asset.delete({ where: { id: assetId } }),
    ]);
    AppLogger.success(
      `Asset metadata cleared successfully out from database matrix layer`,
      ctx,
    );
    return { success: true };
  }

  async deletePost(userId: string, postId: string) {
    const ctx = 'PostsService:DeletePost';
    AppLogger.warn(
      `User ${userId} initiated destructive deletion sequence for post: ${postId}`,
      ctx,
    );

    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { postsAssets: { include: { assets: true } } },
    });
    if (!post) throw new NotFoundException('Post not found');
    if (post.created_by !== userId)
      throw new ForbiddenException('Not authorized');

    post.postsAssets.forEach((pa) => {
      if (fs.existsSync(pa.assets.file_path)) {
        fs.unlinkSync(pa.assets.file_path);
        AppLogger.debug(
          `Purged post reference asset file structural mapping location: ${pa.assets.file_path}`,
          null,
          ctx,
        );
      }
    });

    const assetIds = post.postsAssets.map((pa) => pa.asset_id);
    await this.prisma.$transaction([
      this.prisma.posts_Assets.deleteMany({ where: { post_id: postId } }),
      this.prisma.asset.deleteMany({ where: { id: { in: assetIds } } }),
      this.prisma.post.delete({ where: { id: postId } }),
    ]);
    AppLogger.success(
      `Post ${postId} fully systematically dropped out of core architecture layers`,
      ctx,
    );
    return { success: true };
  }

  async toggleLike(userId: string, postId: string) {
    const ctx = 'PostsService:ToggleLike';
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
      AppLogger.debug(`User ${userId} un-liked post ${postId}`, null, ctx);
      return { liked: false };
    } else {
      await this.prisma.posts_Likes.create({
        data: { post_id: postId, profile_id: profile.id, created_by: userId },
      });
      AppLogger.debug(
        `User ${userId} registered a unique positive like for post: ${postId}`,
        null,
        ctx,
      );
      return { liked: true };
    }
  }
}
