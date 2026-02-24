import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service.js';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  async getDbStatus() {
    const result = await this.prisma.$queryRaw<{ now: Date }[]>`SELECT NOW()`;
    return {
      serverTime: result[0]?.now,
    };
  }
}
