import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('debug-db')
  async debugDb() {
    const result = await this.prisma.$queryRaw<{ now: Date }[]>`SELECT NOW()`;

    return {
      status: 'ok',
      serverTime: result[0]?.now,
    };
  }
}
