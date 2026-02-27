import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async createPost(profileId: string, content: string, assetIds: string[]) {
    return this.prisma.post.create({
      data: {
        content,
        authorId: profileId,
        assets: {
          connect: assetIds.map((id) => ({ id })),
        },
      },
    });
  }
}
