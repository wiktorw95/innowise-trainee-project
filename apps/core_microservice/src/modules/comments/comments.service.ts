import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@innogram/shared';
import { CreateCommentDto, UpdateCommentDto } from './dto/comments.dto.js';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async createComment(userId: string, postId: string, dto: CreateCommentDto) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');

    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    if (dto.parentCommentId) {
      const parent = await this.prisma.comment.findUnique({
        where: { id: dto.parentCommentId },
      });
      if (!parent) throw new NotFoundException('Parent comment not found');
    }

    // const mentions =
    //   dto.content.match(/@(\w+)/g)?.map((m) => m.substring(1)) || [];

    return this.prisma.comment.create({
      data: {
        content: dto.content,
        post_id: postId,
        profile_id: profile.id,
        parent_comment_id: dto.parentCommentId,
        created_by: userId,
      },
      include: {
        profile: { select: { username: true, avatarUrl: true } },
      },
    });
  }

  async getPostComments(postId: string) {
    return this.prisma.comment.findMany({
      where: { post_id: postId, parent_comment_id: null },
      orderBy: { created_at: 'desc' },
      include: {
        profile: { select: { username: true, avatarUrl: true } },
        replies: {
          include: { profile: { select: { username: true, avatarUrl: true } } },
        },
        _count: { select: { commentsLikes: true } },
      },
    });
  }

  async updateComment(
    userId: string,
    commentId: string,
    dto: UpdateCommentDto,
  ) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.created_by !== userId)
      throw new ForbiddenException('Not authorized');

    return this.prisma.comment.update({
      where: { id: commentId },
      data: { content: dto.content, updated_by: userId },
    });
  }

  async deleteComment(userId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.created_by !== userId)
      throw new ForbiddenException('Not authorized');

    await this.prisma.comment.delete({ where: { id: commentId } });
    return { success: true };
  }
}
